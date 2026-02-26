<?php
/**
 * Plugin Name: Football Live Core
 * Description: Matches CPT + embed extraction from detail URL + shortcodes.
 * Version: 0.1.0
 */

if (!defined('ABSPATH')) { exit; }

define('FOOTBALL_LIVE_CORE_VERSION', '0.1.0');

// Base URL for external API (Next.js scraper) used to fetch embeds from an index URL.
if (!defined('FOOTBALL_LIVE_API_BASE')) {
  define('FOOTBALL_LIVE_API_BASE', 'https://match-roan-ten.vercel.app');
}

// Plugin activation: create core categories/pages + sample posts + flush permalinks
function flc_on_activate() {
  // Ensure CPT is registered so rewrite rules include /match/{slug}
  flc_register_match_cpt();

  // Core categories for homepage sections
  $cats = array(
    array('name' => 'News', 'slug' => 'news'),
    array('name' => 'Football', 'slug' => 'football'),
    array('name' => 'Premier League', 'slug' => 'premier-league'),
  );
  foreach ($cats as $c) {
    if (!term_exists($c['slug'], 'category')) {
      wp_insert_term($c['name'], 'category', array('slug' => $c['slug']));
    }
  }

  // Helper: ensure a page with given slug exists
  $ensure_page = function ($title, $slug) {
    $page = get_page_by_path($slug);
    if ($page) return $page->ID;
    return wp_insert_post(array(
      'post_title'   => $title,
      'post_name'    => $slug,
      'post_type'    => 'page',
      'post_status'  => 'publish',
      'post_content' => '',
    ));
  };

  // Header pages: same slug as category so template can show that category's posts (grid)
  $home_id     = $ensure_page('Home', 'home');
  $news_id     = $ensure_page('News', 'news');
  $football_id = $ensure_page('Football', 'football');
  $pl_id       = $ensure_page('Premier League', 'premier-league');
  $about_id    = $ensure_page('About Us', 'about');
  $disc_id     = $ensure_page('Disclaimer', 'disclaimer');
  $terms_id    = $ensure_page('Terms & Conditions', 'terms');
  $priv_id     = $ensure_page('Privacy Policy', 'privacy');
  $cookies_id  = $ensure_page('Cookies Policy', 'cookies');
  $ccpa_id     = $ensure_page('CCPA', 'ccpa');
  $contact_id  = $ensure_page('Contact Us', 'contact');

  // Static homepage ⇒ our Home page
  if ($home_id && !is_wp_error($home_id)) {
    update_option('show_on_front', 'page');
    update_option('page_on_front', $home_id);
  }

  // Create one sample post in each category if empty (so cards appear)
  $create_sample = function ($title, $slug) {
    $cat = get_term_by('slug', $slug, 'category');
    if (!$cat || is_wp_error($cat)) return;
    $existing = get_posts(array(
      'post_type'      => 'post',
      'posts_per_page' => 1,
      'cat'            => $cat->term_id,
      'fields'         => 'ids',
    ));
    if ($existing) return;
    wp_insert_post(array(
      'post_title'   => $title,
      'post_type'    => 'post',
      'post_status'  => 'publish',
      'post_content' => 'Sample content for ' . $title . '. Replace with your own article.',
      'post_category'=> array($cat->term_id),
    ));
  };

  $create_sample('Sample News Post', 'news');
  $create_sample('Sample Football Post', 'football');
  $create_sample('Sample Premier League Post', 'premier-league');

  // Make sure permalinks know about /match/ and new pages
  flush_rewrite_rules();

  // Schedule 30-min stream health checker (if not already scheduled)
  if (!wp_next_scheduled('flc_check_streams_event')) {
    wp_schedule_event(time(), 'flc_30min', 'flc_check_streams_event');
  }
}
register_activation_hook(__FILE__, 'flc_on_activate');

// Clear cron event on deactivation
function flc_on_deactivate() {
  wp_clear_scheduled_hook('flc_check_streams_event');
}
register_deactivation_hook(__FILE__, 'flc_on_deactivate');

// Custom 30-min interval for WP-Cron
function flc_cron_schedules($schedules) {
  if (!isset($schedules['flc_30min'])) {
    $schedules['flc_30min'] = array(
      'interval' => 30 * MINUTE_IN_SECONDS,
      'display'  => __('Every 30 Minutes (Football Live)', 'football-live'),
    );
  }
  return $schedules;
}
add_filter('cron_schedules', 'flc_cron_schedules');

function flc_register_match_cpt() {
  register_post_type('match', array(
    'labels' => array(
      'name' => 'Matches',
      'singular_name' => 'Match',
      'add_new_item' => 'Add Match',
      'edit_item' => 'Edit Match',
    ),
    'public' => true,
    'has_archive' => true,
    'rewrite' => array('slug' => 'match'),
    'menu_icon' => 'dashicons-video-alt3',
    'supports' => array('title', 'editor'),
    'show_in_rest' => true,
  ));
}
add_action('init', 'flc_register_match_cpt');

function flc_add_match_metaboxes() {
  add_meta_box('flc_match_meta', 'Match Details', 'flc_render_match_metabox', 'match', 'normal', 'high');
}
add_action('add_meta_boxes_match', 'flc_add_match_metaboxes');

// Stream links box on normal WordPress pages as well
function flc_add_page_stream_metabox() {
  add_meta_box('flc_page_stream_meta', 'Stream Links', 'flc_render_page_stream_metabox', 'page', 'normal', 'high');
}
add_action('add_meta_boxes_page', 'flc_add_page_stream_metabox');

// Enqueue script for "Fetch streams now" button on page edit screen
function flc_enqueue_page_stream_script($hook) {
  if ($hook !== 'post.php' && $hook !== 'post-new.php') return;
  global $post;
  if (!$post || $post->post_type !== 'page') return;
  $url = plugin_dir_url(__FILE__) . 'page-stream-fetch.js';
  wp_enqueue_script('flc-page-stream-fetch', $url, array(), FOOTBALL_LIVE_CORE_VERSION, true);
  wp_add_inline_script('flc-page-stream-fetch', "
    document.addEventListener('DOMContentLoaded', function() {
      var btn = document.getElementById('flc-fetch-page-streams-btn');
      var resultEl = document.getElementById('flc-fetch-page-result');
      if (!btn || !resultEl) return;
      btn.addEventListener('click', function() {
        var indexUrl = (document.querySelector('input[name=\"fl_index_url\"]') || {}).value || '';
        var detailUrl = (document.querySelector('input[name=\"fl_detail_url\"]') || {}).value || '';
        if (!indexUrl && !detailUrl) {
          resultEl.textContent = 'Enter Main Source URL or Match Page URL first.';
          resultEl.style.color = '#b32d2e';
          return;
        }
        resultEl.textContent = 'Fetching…';
        resultEl.style.color = '#666';
        btn.disabled = true;
        var postId = btn.getAttribute('data-post-id') || (document.querySelector('input[name=\"post_ID\"]') && document.querySelector('input[name=\"post_ID\"]').value) || '';
        if (!postId) {
          resultEl.textContent = 'Save the page once first, then fetch.';
          resultEl.style.color = '#b32d2e';
          btn.disabled = false;
          return;
        }
        var fd = new FormData();
        fd.append('action', 'flc_fetch_page_streams');
        fd.append('nonce', '" . wp_create_nonce('flc_fetch_page_streams') . "');
        fd.append('post_id', postId);
        fd.append('fl_index_url', indexUrl);
        fd.append('fl_detail_url', detailUrl);
        fetch('" . esc_js(admin_url('admin-ajax.php')) . "', { method: 'POST', body: fd, credentials: 'same-origin' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            btn.disabled = false;
            if (data && data.success && data.data) {
              resultEl.textContent = 'Saved ' + (data.data.saved || 0) + ' stream(s). Refresh the page to see the player.';
              resultEl.style.color = '#00a32a';
            } else {
              resultEl.textContent = (data && data.data && data.data.error) ? data.data.error : (data && data.message) || 'Fetch failed.';
              resultEl.style.color = '#b32d2e';
            }
          })
          .catch(function() {
            btn.disabled = false;
            resultEl.textContent = 'Network error.';
            resultEl.style.color = '#b32d2e';
          });
      });
    });
  ");
}
add_action('admin_enqueue_scripts', 'flc_enqueue_page_stream_script');

function flc_render_match_metabox($post) {
  wp_nonce_field('flc_match_meta_save', 'flc_match_meta_nonce');
  $fields = array(
    'index_url' => get_post_meta($post->ID, '_fl_index_url', true),
    'detail_url' => get_post_meta($post->ID, '_fl_detail_url', true),
    'stream_url' => get_post_meta($post->ID, '_fl_stream_url', true),
    'detail_url_2' => get_post_meta($post->ID, '_fl_detail_url_2', true),
    'detail_url_3' => get_post_meta($post->ID, '_fl_detail_url_3', true),
    'detail_url_4' => get_post_meta($post->ID, '_fl_detail_url_4', true),
    'stream_url_2' => get_post_meta($post->ID, '_fl_stream_url_2', true),
    'stream_url_3' => get_post_meta($post->ID, '_fl_stream_url_3', true),
    'stream_url_4' => get_post_meta($post->ID, '_fl_stream_url_4', true),
    'detail_url_5' => get_post_meta($post->ID, '_fl_detail_url_5', true),
    'detail_url_6' => get_post_meta($post->ID, '_fl_detail_url_6', true),
    'detail_url_7' => get_post_meta($post->ID, '_fl_detail_url_7', true),
    'detail_url_8' => get_post_meta($post->ID, '_fl_detail_url_8', true),
    'stream_url_5' => get_post_meta($post->ID, '_fl_stream_url_5', true),
    'stream_url_6' => get_post_meta($post->ID, '_fl_stream_url_6', true),
    'stream_url_7' => get_post_meta($post->ID, '_fl_stream_url_7', true),
    'stream_url_8' => get_post_meta($post->ID, '_fl_stream_url_8', true),
    'league_name' => get_post_meta($post->ID, '_fl_league_name', true),
    'league_logo' => get_post_meta($post->ID, '_fl_league_logo', true),
    'league_color' => get_post_meta($post->ID, '_fl_league_color', true),
    'home_team' => get_post_meta($post->ID, '_fl_home_team', true),
    'away_team' => get_post_meta($post->ID, '_fl_away_team', true),
    'home_logo' => get_post_meta($post->ID, '_fl_home_logo', true),
    'away_logo' => get_post_meta($post->ID, '_fl_away_logo', true),
    'status' => get_post_meta($post->ID, '_fl_status', true),
    'match_time' => get_post_meta($post->ID, '_fl_match_time', true),
    'stream_ends_at' => get_post_meta($post->ID, '_fl_stream_ends_at', true),
  );

  $status = $fields['status'] ?: 'LIVE';
  ?>
  <p><label><strong>Main Source URL (index page, optional)</strong></label><br>
    <input style="width:100%" type="url" name="fl_index_url" value="<?php echo esc_attr($fields['index_url']); ?>" placeholder="https://... (e.g. Footybite / Totalsportek / Papahd index page)" />
    <span style="display:block;color:#666;font-size:12px;margin-top:2px;">If filled, we will try to auto-fill the Match Page URL fields from this index page on save.</span>
  </p>
  <p><label><strong>Match Page URL</strong></label><br>
    <input style="width:100%" type="url" name="fl_detail_url" value="<?php echo esc_attr($fields['detail_url']); ?>" placeholder="https://..." />
  </p>
  <p><label><strong>Stream URL</strong></label><br>
    <input style="width:100%" type="url" name="fl_stream_url" value="<?php echo esc_attr($fields['stream_url']); ?>" placeholder="https://..." />
  </p>
  <div style="margin:12px 0;padding:10px 12px;border:1px solid #ddd;border-radius:4px;background:#fafafa;">
    <p style="margin-top:0;">
      <strong>Additional Match Page URLs (optional)</strong><br>
      <span style="display:block;color:#666;font-size:12px;margin-top:2px;">
        You can add up to 7 extra source links. On save (with fetch enabled), the plugin will try to grab iframe/stream URLs from each and use them as backup links on the match page.
      </span>
    </p>
    <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;">
      <div>
        <p><label><strong>Match Page URL #2</strong></label><br>
          <input style="width:100%" type="url" name="fl_detail_url_2" value="<?php echo esc_attr($fields['detail_url_2']); ?>" placeholder="https://..." />
        </p>
        <p><label><strong>Stream URL #2</strong></label><br>
          <input style="width:100%" type="url" name="fl_stream_url_2" value="<?php echo esc_attr($fields['stream_url_2']); ?>" placeholder="https://..." />
        </p>
      </div>
      <div>
        <p><label><strong>Match Page URL #3</strong></label><br>
          <input style="width:100%" type="url" name="fl_detail_url_3" value="<?php echo esc_attr($fields['detail_url_3']); ?>" placeholder="https://..." />
        </p>
        <p><label><strong>Stream URL #3</strong></label><br>
          <input style="width:100%" type="url" name="fl_stream_url_3" value="<?php echo esc_attr($fields['stream_url_3']); ?>" placeholder="https://..." />
        </p>
      </div>
      <div>
        <p><label><strong>Match Page URL #4</strong></label><br>
          <input style="width:100%" type="url" name="fl_detail_url_4" value="<?php echo esc_attr($fields['detail_url_4']); ?>" placeholder="https://..." />
        </p>
        <p><label><strong>Stream URL #4</strong></label><br>
          <input style="width:100%" type="url" name="fl_stream_url_4" value="<?php echo esc_attr($fields['stream_url_4']); ?>" placeholder="https://..." />
        </p>
      </div>
      <div>
        <p><label><strong>Match Page URL #5</strong></label><br>
          <input style="width:100%" type="url" name="fl_detail_url_5" value="<?php echo esc_attr($fields['detail_url_5']); ?>" placeholder="https://..." />
        </p>
        <p><label><strong>Stream URL #5</strong></label><br>
          <input style="width:100%" type="url" name="fl_stream_url_5" value="<?php echo esc_attr($fields['stream_url_5']); ?>" placeholder="https://..." />
        </p>
      </div>
      <div>
        <p><label><strong>Match Page URL #6</strong></label><br>
          <input style="width:100%" type="url" name="fl_detail_url_6" value="<?php echo esc_attr($fields['detail_url_6']); ?>" placeholder="https://..." />
        </p>
        <p><label><strong>Stream URL #6</strong></label><br>
          <input style="width:100%" type="url" name="fl_stream_url_6" value="<?php echo esc_attr($fields['stream_url_6']); ?>" placeholder="https://..." />
        </p>
      </div>
      <div>
        <p><label><strong>Match Page URL #7</strong></label><br>
          <input style="width:100%" type="url" name="fl_detail_url_7" value="<?php echo esc_attr($fields['detail_url_7']); ?>" placeholder="https://..." />
        </p>
        <p><label><strong>Stream URL #7</strong></label><br>
          <input style="width:100%" type="url" name="fl_stream_url_7" value="<?php echo esc_attr($fields['stream_url_7']); ?>" placeholder="https://..." />
        </p>
      </div>
      <div>
        <p><label><strong>Match Page URL #8</strong></label><br>
          <input style="width:100%" type="url" name="fl_detail_url_8" value="<?php echo esc_attr($fields['detail_url_8']); ?>" placeholder="https://..." />
        </p>
        <p><label><strong>Stream URL #8</strong></label><br>
          <input style="width:100%" type="url" name="fl_stream_url_8" value="<?php echo esc_attr($fields['stream_url_8']); ?>" placeholder="https://..." />
        </p>
      </div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
    <p><label><strong>League / Tournament</strong></label><br>
      <input style="width:100%" type="text" name="fl_league_name" value="<?php echo esc_attr($fields['league_name']); ?>" placeholder="Premier League" />
    </p>
    <p><label><strong>League Logo URL</strong></label><br>
      <input style="width:100%" type="url" name="fl_league_logo" value="<?php echo esc_attr($fields['league_logo']); ?>" placeholder="https://..." />
    </p>
    <p><label><strong>League Color</strong></label><br>
      <input style="width:100%" type="text" name="fl_league_color" value="<?php echo esc_attr($fields['league_color']); ?>" placeholder="#7C3AED" />
      <span style="display:block;color:#666;font-size:12px;margin-top:4px;">Hex color (optional)</span>
    </p>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
    <p><label><strong>Home Team</strong></label><br>
      <input style="width:100%" type="text" name="fl_home_team" value="<?php echo esc_attr($fields['home_team']); ?>" />
    </p>
    <p><label><strong>Away Team</strong></label><br>
      <input style="width:100%" type="text" name="fl_away_team" value="<?php echo esc_attr($fields['away_team']); ?>" />
    </p>
    <p><label><strong>Home Logo URL (optional)</strong></label><br>
      <input style="width:100%" type="url" name="fl_home_logo" value="<?php echo esc_attr($fields['home_logo']); ?>" placeholder="https://..." />
    </p>
    <p><label><strong>Away Logo URL (optional)</strong></label><br>
      <input style="width:100%" type="url" name="fl_away_logo" value="<?php echo esc_attr($fields['away_logo']); ?>" placeholder="https://..." />
    </p>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
    <p><label><strong>Status</strong></label><br>
      <select name="fl_status" style="width:100%">
        <?php foreach (array('LIVE','UPCOMING','FINISHED') as $s) : ?>
          <option value="<?php echo esc_attr($s); ?>" <?php selected($status, $s); ?>><?php echo esc_html($s); ?></option>
        <?php endforeach; ?>
      </select>
    </p>
    <p><label><strong>Match time (ISO or datetime)</strong></label><br>
      <input style="width:100%" type="text" name="fl_match_time" value="<?php echo esc_attr($fields['match_time']); ?>" placeholder="2026-02-25T10:00:00Z" />
    </p>
    <p><label><strong>Stream ends at (optional)</strong></label><br>
      <?php
      $ends_at_val = trim((string) $fields['stream_ends_at']);
      if ($ends_at_val) {
        $ends_at_val = str_replace(' ', 'T', substr($ends_at_val, 0, 16));
      }
      ?>
      <input style="width:100%" type="datetime-local" name="fl_stream_ends_at" value="<?php echo esc_attr($ends_at_val); ?>" />
      <span style="display:block;color:#666;font-size:12px;margin-top:2px;">After this date/time the stream will be hidden on the match page.</span>
    </p>
    <p><label><strong>Or: hide stream after (from when you save)</strong></label><br>
      <span style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <input type="number" name="fl_stream_ends_in_value" value="" min="1" max="999" step="1" placeholder="e.g. 30" style="width:70px;" />
        <select name="fl_stream_ends_in_unit" style="width:90px;">
          <option value="minutes">minutes</option>
          <option value="hours">hours</option>
        </select>
      </span>
      <span style="display:block;color:#666;font-size:12px;margin-top:2px;">User says &quot;stream will end in 30 mins&quot; or &quot;1 hour&quot; – fill here and save; exact end time will be set automatically.</span>
    </p>
  </div>

  <p>
    <label>
      <input type="checkbox" name="fl_fetch_on_save" value="1" checked>
      Fetch teams + stream URL from Match Page URL on save
    </label>
  </p>
  <?php
}

// Lighter version of the box for normal Pages: same link system, no teams/league fields
function flc_render_page_stream_metabox($post) {
  wp_nonce_field('flc_page_stream_meta_save', 'flc_page_stream_meta_nonce');
  $fields = array(
    'index_url'   => get_post_meta($post->ID, '_fl_index_url', true),
    'detail_url'   => get_post_meta($post->ID, '_fl_detail_url', true),
    'stream_url'   => get_post_meta($post->ID, '_fl_stream_url', true),
    'detail_url_2' => get_post_meta($post->ID, '_fl_detail_url_2', true),
    'detail_url_3' => get_post_meta($post->ID, '_fl_detail_url_3', true),
    'detail_url_4' => get_post_meta($post->ID, '_fl_detail_url_4', true),
    'stream_url_2' => get_post_meta($post->ID, '_fl_stream_url_2', true),
    'stream_url_3' => get_post_meta($post->ID, '_fl_stream_url_3', true),
    'stream_url_4' => get_post_meta($post->ID, '_fl_stream_url_4', true),
    'detail_url_5' => get_post_meta($post->ID, '_fl_detail_url_5', true),
    'detail_url_6' => get_post_meta($post->ID, '_fl_detail_url_6', true),
    'detail_url_7' => get_post_meta($post->ID, '_fl_detail_url_7', true),
    'detail_url_8' => get_post_meta($post->ID, '_fl_detail_url_8', true),
    'stream_url_5' => get_post_meta($post->ID, '_fl_stream_url_5', true),
    'stream_url_6' => get_post_meta($post->ID, '_fl_stream_url_6', true),
    'stream_url_7' => get_post_meta($post->ID, '_fl_stream_url_7', true),
    'stream_url_8' => get_post_meta($post->ID, '_fl_stream_url_8', true),
  );
  ?>
  <p><label><strong>Main Source URL (index page, optional)</strong></label><br>
    <input style="width:100%" type="url" name="fl_index_url" value="<?php echo esc_attr($fields['index_url']); ?>" placeholder="https://... (e.g. Footybite / Totalsportek / Papahd index page)" />
    <span style="display:block;color:#666;font-size:12px;margin-top:2px;">If filled, we will try to auto-fill the Source URL fields from this index page on save.</span>
  </p>
  <p><label><strong>Match / Source Page URL</strong></label><br>
    <input style="width:100%" type="url" name="fl_detail_url" value="<?php echo esc_attr($fields['detail_url']); ?>" placeholder="https://..." />
  </p>
  <p><label><strong>Stream URL</strong></label><br>
    <input style="width:100%" type="url" name="fl_stream_url" value="<?php echo esc_attr($fields['stream_url']); ?>" placeholder="https://..." />
  </p>
  <div style="margin:12px 0;padding:10px 12px;border:1px solid #ddd;border-radius:4px;background:#fafafa;">
    <p style="margin-top:0;">
      <strong>Additional Source URLs (optional)</strong><br>
      <span style="display:block;color:#666;font-size:12px;margin-top:2px;">
        Add up to 7 extra links. On save (with fetch enabled), the plugin will try to grab iframe/stream URLs from each and use them as Link 2+ on this page.
      </span>
    </p>
    <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;">
      <div>
        <p><label><strong>Source URL #2</strong></label><br>
          <input style="width:100%" type="url" name="fl_detail_url_2" value="<?php echo esc_attr($fields['detail_url_2']); ?>" placeholder="https://..." />
        </p>
        <p><label><strong>Stream URL #2</strong></label><br>
          <input style="width:100%" type="url" name="fl_stream_url_2" value="<?php echo esc_attr($fields['stream_url_2']); ?>" placeholder="https://..." />
        </p>
      </div>
      <div>
        <p><label><strong>Source URL #3</strong></label><br>
          <input style="width:100%" type="url" name="fl_detail_url_3" value="<?php echo esc_attr($fields['detail_url_3']); ?>" placeholder="https://..." />
        </p>
        <p><label><strong>Stream URL #3</strong></label><br>
          <input style="width:100%" type="url" name="fl_stream_url_3" value="<?php echo esc_attr($fields['stream_url_3']); ?>" placeholder="https://..." />
        </p>
      </div>
      <div>
        <p><label><strong>Source URL #4</strong></label><br>
          <input style="width:100%" type="url" name="fl_detail_url_4" value="<?php echo esc_attr($fields['detail_url_4']); ?>" placeholder="https://..." />
        </p>
        <p><label><strong>Stream URL #4</strong></label><br>
          <input style="width:100%" type="url" name="fl_stream_url_4" value="<?php echo esc_attr($fields['stream_url_4']); ?>" placeholder="https://..." />
        </p>
      </div>
      <div>
        <p><label><strong>Source URL #5</strong></label><br>
          <input style="width:100%" type="url" name="fl_detail_url_5" value="<?php echo esc_attr($fields['detail_url_5']); ?>" placeholder="https://..." />
        </p>
        <p><label><strong>Stream URL #5</strong></label><br>
          <input style="width:100%" type="url" name="fl_stream_url_5" value="<?php echo esc_attr($fields['stream_url_5']); ?>" placeholder="https://..." />
        </p>
      </div>
      <div>
        <p><label><strong>Source URL #6</strong></label><br>
          <input style="width:100%" type="url" name="fl_detail_url_6" value="<?php echo esc_attr($fields['detail_url_6']); ?>" placeholder="https://..." />
        </p>
        <p><label><strong>Stream URL #6</strong></label><br>
          <input style="width:100%" type="url" name="fl_stream_url_6" value="<?php echo esc_attr($fields['stream_url_6']); ?>" placeholder="https://..." />
        </p>
      </div>
      <div>
        <p><label><strong>Source URL #7</strong></label><br>
          <input style="width:100%" type="url" name="fl_detail_url_7" value="<?php echo esc_attr($fields['detail_url_7']); ?>" placeholder="https://..." />
        </p>
        <p><label><strong>Stream URL #7</strong></label><br>
          <input style="width:100%" type="url" name="fl_stream_url_7" value="<?php echo esc_attr($fields['stream_url_7']); ?>" placeholder="https://..." />
        </p>
      </div>
      <div>
        <p><label><strong>Source URL #8</strong></label><br>
          <input style="width:100%" type="url" name="fl_detail_url_8" value="<?php echo esc_attr($fields['detail_url_8']); ?>" placeholder="https://..." />
        </p>
        <p><label><strong>Stream URL #8</strong></label><br>
          <input style="width:100%" type="url" name="fl_stream_url_8" value="<?php echo esc_attr($fields['stream_url_8']); ?>" placeholder="https://..." />
        </p>
      </div>
    </div>
  </div>
  <p>
    <label>
      <input type="checkbox" name="fl_page_fetch_on_save" value="1" checked>
      Try to fetch stream URLs from source URLs on save
    </label>
  </p>
  <p>
    <button type="button" class="button button-secondary" id="flc-fetch-page-streams-btn" data-post-id="<?php echo (int) $post->ID; ?>">
      Fetch streams now
    </button>
    <span id="flc-fetch-page-result" style="margin-left:8px;font-size:12px;color:#666;"></span>
  </p>
  <p style="font-size:12px;color:#666;">
    If you use the block editor, &quot;Update&quot; does not send this form. Paste the index URL above and click <strong>Fetch streams now</strong> to load streams.
  </p>
  <?php
}

function flc_http_get($url) {
  $resp = wp_remote_get($url, array(
    'timeout' => 20,
    'redirection' => 5,
    'headers' => array(
      'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ),
  ));
  if (is_wp_error($resp)) return null;
  $code = wp_remote_retrieve_response_code($resp);
  if ($code < 200 || $code >= 300) return null;
  return wp_remote_retrieve_body($resp);
}

function flc_parse_teams_from_title($title) {
  $t = trim((string)$title);
  if ($t === '') return null;
  if (preg_match('/(.+?)\s+vs\.?\s+(.+?)(?:\s+[-–|]|\s+Live|$)/i', $t, $m) || preg_match('/(.+?)\s+vs\.?\s+(.+)/i', $t, $m)) {
    $home = trim($m[1]);
    $away = trim(preg_replace('/\s+Live\s+stream.*$/i', '', $m[2]));
    if ($home !== '' && $away !== '') return array($home, $away);
  }
  return null;
}

function flc_is_invalid_embed($url) {
  $u = trim((string)$url);
  if ($u === '') return true;
  $lu = strtolower($u);
  if ($lu === 'about:blank' || $lu === 'about:srcdoc') return true;
  // PHP 7/8 compatible "starts with"
  if (substr($lu, 0, 11) === 'javascript:' || substr($lu, 0, 5) === 'data:') return true;
  return false;
}

function flc_url_resolve($base, $rel) {
  $rel = trim((string)$rel);
  if ($rel === '') return '';
  if (preg_match('/^https?:\/\//i', $rel)) return esc_url_raw($rel);

  $b = wp_parse_url($base);
  if (!$b || empty($b['scheme']) || empty($b['host'])) return esc_url_raw($rel);
  $scheme = $b['scheme'];
  $host = $b['host'];
  $port = isset($b['port']) ? ':' . $b['port'] : '';
  $base_path = isset($b['path']) ? $b['path'] : '/';
  $base_dir = preg_replace('/\/[^\/]*$/', '/', $base_path);

  if (substr($rel, 0, 2) === '//') return esc_url_raw($scheme . ':' . $rel);
  if (substr($rel, 0, 1) === '/') return esc_url_raw($scheme . '://' . $host . $port . $rel);
  return esc_url_raw($scheme . '://' . $host . $port . $base_dir . $rel);
}

function flc_find_iframe_src($html, $base_url) {
  if (!$html) return '';
  // quick regex for iframe src (first valid)
  if (preg_match_all('/<iframe[^>]+src=[\"\']([^\"\']+)[\"\']/i', $html, $m)) {
    foreach ($m[1] as $src) {
      $src = trim((string)$src);
      if ($src === '' || flc_is_invalid_embed($src)) continue;
      $resolved = flc_url_resolve($base_url, $src);
      if ($resolved === '' || flc_is_invalid_embed($resolved)) continue;
      return $resolved;
    }
  }
  return '';
}

function flc_extract_from_detail_url($detail_url) {
  $html = flc_http_get($detail_url);
  if (!$html) return array(null, null, '', null, null);
  $title = '';
  if (preg_match('/<title[^>]*>(.*?)<\/title>/is', $html, $m)) {
    $title = wp_strip_all_tags($m[1]);
  }
  $teams = flc_parse_teams_from_title($title);
  $home = $teams ? $teams[0] : null;
  $away = $teams ? $teams[1] : null;
  $embed = flc_find_iframe_src($html, $detail_url);
  // Very simple league logo detection based on common keywords
  $league_name = null;
  $league_logo = null;
  if (preg_match_all('/<img[^>]+>/i', $html, $imgs)) {
    $patterns = array(
      'UEFA Champions League' => array('champions league', 'ucl'),
      'Premier League' => array('premier league', 'epl'),
      'La Liga' => array('la liga', 'laliga'),
      'Bundesliga' => array('bundesliga'),
      'Serie A' => array('serie a'),
      'Ligue 1' => array('ligue 1'),
      'Europa League' => array('europa league'),
    );
    foreach ($imgs[0] as $tag) {
      $tag_lower = strtolower($tag);
      $src = '';
      if (preg_match('/src=[\"\']([^\"\']+)[\"\']/i', $tag, $m2)) {
        $src = trim($m2[1]);
      }
      $alt = '';
      if (preg_match('/alt=[\"\']([^\"\']+)[\"\']/i', $tag, $m3)) {
        $alt = strtolower(trim($m3[1]));
      }
      foreach ($patterns as $lname => $keys) {
        foreach ($keys as $key) {
          if (strpos($tag_lower, $key) !== false || ($alt && strpos($alt, $key) !== false)) {
            $league_name = $lname;
            if ($src) {
              $league_logo = flc_url_resolve($detail_url, $src);
            }
            break 3;
          }
        }
      }
    }
  }
  return array($home, $away, $embed, $league_name, $league_logo);
}

// Extract provider/detail URLs from an index page (e.g. Footybite / Totalsportek / Papahd)
function flc_extract_detail_urls_from_index_html($index_url, $html) {
  $urls = array();
  if (!$html) return $urls;

  $host = wp_parse_url($index_url, PHP_URL_HOST);
  $host = strtolower((string) $host);

  // Footybite-style: THANK YOU links inside the table
  if (strpos($host, 'footybite') !== false) {
    if (preg_match_all('/<a[^>]+href=[\"\']([^\"\']+)[\"\'][^>]*>[^<]*THANK YOU[^<]*<\/a>/i', $html, $m)) {
      foreach ($m[1] as $href) {
        $href = trim((string) $href);
        if ($href === '') continue;
        $urls[] = flc_url_resolve($index_url, $href);
      }
    }
  }

  // Totalsportek-style: Watch links
  if (strpos($host, 'totalsportek777') !== false || strpos($host, 'totalsportek') !== false) {
    if (preg_match_all('/<a[^>]+href=[\"\']([^\"\']+)[\"\'][^>]*>.*?Watch.*?<\/a>/is', $html, $m)) {
      foreach ($m[1] as $href) {
        $href = trim((string) $href);
        if ($href === '') continue;
        $urls[] = flc_url_resolve($index_url, $href);
      }
    }
  }

  // Papahd-style: Link 1 / Link 2 / Link HD
  if (strpos($host, 'papashd') !== false || strpos($host, 'papahd') !== false) {
    if (preg_match_all('/<a[^>]+href=[\"\']([^\"\']+)[\"\'][^>]*>\s*Link\s*(?:\d+|HD|FULLHD)[^<]*<\/a>/i', $html, $m)) {
      foreach ($m[1] as $href) {
        $href = trim((string) $href);
        if ($href === '') continue;
        $urls[] = flc_url_resolve($index_url, $href);
      }
    }
  }

  // Deduplicate and cap (primary + backups)
  $unique = array();
  foreach ($urls as $u) {
    if (!in_array($u, $unique, true)) {
      $unique[] = $u;
    }
  }
  // Totalsportek pages often have many providers – keep a high cap so we can
  // test a lot of them and pick only working streams later.
  return array_slice($unique, 0, 60);
}

// Fill _fl_detail_url, _fl_detail_url_2..4 from an index URL (only into empty slots)
function flc_populate_detail_urls_from_index($post_id, $index_url, $html) {
  $detail_urls = flc_extract_detail_urls_from_index_html($index_url, $html);
  if (!$detail_urls) return;

  $slots = array('_fl_detail_url', '_fl_detail_url_2', '_fl_detail_url_3', '_fl_detail_url_4');
  foreach ($slots as $i => $meta_key) {
    if (!isset($detail_urls[$i])) break;
    $existing = trim((string) get_post_meta($post_id, $meta_key, true));
    if ($existing !== '') continue; // don't override manual entries
    update_post_meta($post_id, $meta_key, esc_url_raw($detail_urls[$i]));
  }
}

function flc_save_match_meta($post_id) {
  if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
  if (!isset($_POST['flc_match_meta_nonce']) || !wp_verify_nonce($_POST['flc_match_meta_nonce'], 'flc_match_meta_save')) return;
  if (!current_user_can('edit_post', $post_id)) return;

  $index  = isset($_POST['fl_index_url']) ? esc_url_raw(trim($_POST['fl_index_url'])) : '';
  $detail = isset($_POST['fl_detail_url']) ? esc_url_raw(trim($_POST['fl_detail_url'])) : '';
  $stream = isset($_POST['fl_stream_url']) ? esc_url_raw(trim($_POST['fl_stream_url'])) : '';
  $detail2 = isset($_POST['fl_detail_url_2']) ? esc_url_raw(trim($_POST['fl_detail_url_2'])) : '';
  $detail3 = isset($_POST['fl_detail_url_3']) ? esc_url_raw(trim($_POST['fl_detail_url_3'])) : '';
  $detail4 = isset($_POST['fl_detail_url_4']) ? esc_url_raw(trim($_POST['fl_detail_url_4'])) : '';
  $detail5 = isset($_POST['fl_detail_url_5']) ? esc_url_raw(trim($_POST['fl_detail_url_5'])) : '';
  $detail6 = isset($_POST['fl_detail_url_6']) ? esc_url_raw(trim($_POST['fl_detail_url_6'])) : '';
  $detail7 = isset($_POST['fl_detail_url_7']) ? esc_url_raw(trim($_POST['fl_detail_url_7'])) : '';
  $detail8 = isset($_POST['fl_detail_url_8']) ? esc_url_raw(trim($_POST['fl_detail_url_8'])) : '';
  $stream2 = isset($_POST['fl_stream_url_2']) ? esc_url_raw(trim($_POST['fl_stream_url_2'])) : '';
  $stream3 = isset($_POST['fl_stream_url_3']) ? esc_url_raw(trim($_POST['fl_stream_url_3'])) : '';
  $stream4 = isset($_POST['fl_stream_url_4']) ? esc_url_raw(trim($_POST['fl_stream_url_4'])) : '';
  $stream5 = isset($_POST['fl_stream_url_5']) ? esc_url_raw(trim($_POST['fl_stream_url_5'])) : '';
  $stream6 = isset($_POST['fl_stream_url_6']) ? esc_url_raw(trim($_POST['fl_stream_url_6'])) : '';
  $stream7 = isset($_POST['fl_stream_url_7']) ? esc_url_raw(trim($_POST['fl_stream_url_7'])) : '';
  $stream8 = isset($_POST['fl_stream_url_8']) ? esc_url_raw(trim($_POST['fl_stream_url_8'])) : '';
  $league_name = isset($_POST['fl_league_name']) ? sanitize_text_field($_POST['fl_league_name']) : '';
  $league_logo = isset($_POST['fl_league_logo']) ? esc_url_raw(trim($_POST['fl_league_logo'])) : '';
  $league_color = isset($_POST['fl_league_color']) ? sanitize_text_field($_POST['fl_league_color']) : '';
  $home = isset($_POST['fl_home_team']) ? sanitize_text_field($_POST['fl_home_team']) : '';
  $away = isset($_POST['fl_away_team']) ? sanitize_text_field($_POST['fl_away_team']) : '';
  $home_logo = isset($_POST['fl_home_logo']) ? esc_url_raw(trim($_POST['fl_home_logo'])) : '';
  $away_logo = isset($_POST['fl_away_logo']) ? esc_url_raw(trim($_POST['fl_away_logo'])) : '';
  $status = isset($_POST['fl_status']) ? sanitize_text_field($_POST['fl_status']) : 'LIVE';
  $match_time = isset($_POST['fl_match_time']) ? sanitize_text_field($_POST['fl_match_time']) : '';
  $stream_ends_at_raw = isset($_POST['fl_stream_ends_at']) ? sanitize_text_field($_POST['fl_stream_ends_at']) : '';
  $stream_ends_at = $stream_ends_at_raw ? str_replace('T', ' ', substr($stream_ends_at_raw, 0, 16)) : '';
  // If user set "ends in X minutes/hours", compute end time from now and use that.
  $ends_in_value = isset($_POST['fl_stream_ends_in_value']) ? absint($_POST['fl_stream_ends_in_value']) : 0;
  $ends_in_unit = isset($_POST['fl_stream_ends_in_unit']) && $_POST['fl_stream_ends_in_unit'] === 'hours' ? 'hours' : 'minutes';
  if ($ends_in_value > 0) {
    $seconds = $ends_in_unit === 'hours' ? ( $ends_in_value * 3600 ) : ( $ends_in_value * 60 );
    $stream_ends_at = gmdate('Y-m-d H:i:s', time() + $seconds);
  }

  update_post_meta($post_id, '_fl_index_url', $index);
  update_post_meta($post_id, '_fl_detail_url', $detail);
  update_post_meta($post_id, '_fl_stream_url', $stream);
  update_post_meta($post_id, '_fl_detail_url_2', $detail2);
  update_post_meta($post_id, '_fl_detail_url_3', $detail3);
  update_post_meta($post_id, '_fl_detail_url_4', $detail4);
  update_post_meta($post_id, '_fl_stream_url_2', $stream2);
  update_post_meta($post_id, '_fl_stream_url_3', $stream3);
  update_post_meta($post_id, '_fl_stream_url_4', $stream4);
  update_post_meta($post_id, '_fl_detail_url_5', $detail5);
  update_post_meta($post_id, '_fl_detail_url_6', $detail6);
  update_post_meta($post_id, '_fl_detail_url_7', $detail7);
  update_post_meta($post_id, '_fl_detail_url_8', $detail8);
  update_post_meta($post_id, '_fl_stream_url_5', $stream5);
  update_post_meta($post_id, '_fl_stream_url_6', $stream6);
  update_post_meta($post_id, '_fl_stream_url_7', $stream7);
  update_post_meta($post_id, '_fl_stream_url_8', $stream8);
  update_post_meta($post_id, '_fl_league_name', $league_name);
  update_post_meta($post_id, '_fl_league_logo', $league_logo);
  update_post_meta($post_id, '_fl_league_color', $league_color);
  update_post_meta($post_id, '_fl_home_team', $home);
  update_post_meta($post_id, '_fl_away_team', $away);
  update_post_meta($post_id, '_fl_home_logo', $home_logo);
  update_post_meta($post_id, '_fl_away_logo', $away_logo);
  update_post_meta($post_id, '_fl_status', in_array($status, array('LIVE','UPCOMING','FINISHED'), true) ? $status : 'LIVE');
  update_post_meta($post_id, '_fl_match_time', $match_time);
  update_post_meta($post_id, '_fl_stream_ends_at', $stream_ends_at);

  $do_fetch = isset($_POST['fl_fetch_on_save']) && ($detail || $index);
  if ($do_fetch) {
    // First try external API (Next.js) using the main index URL to get up to 4 working embed URLs.
    if ($index && defined('FOOTBALL_LIVE_API_BASE')) {
      $api_url = trailingslashit(FOOTBALL_LIVE_API_BASE) . 'api/fetch-embeds-from-index';
      $resp = wp_remote_post($api_url, array(
        'timeout' => 25,
        'headers' => array('Content-Type' => 'application/json'),
        'body'    => wp_json_encode(array('indexUrl' => $index)),
      ));
      if (!is_wp_error($resp)) {
        $code = wp_remote_retrieve_response_code($resp);
        if ($code >= 200 && $code < 300) {
          $body = wp_remote_retrieve_body($resp);
          $data = json_decode($body, true);
          if (is_array($data) && !empty($data['ok']) && !empty($data['embeds']) && is_array($data['embeds'])) {
            $embeds = $data['embeds'];
            // Only keep embeds whose URL responds (working stream) – then only that many buttons will show.
            $working_embeds = array();
            foreach ($embeds as $embed_item) {
              if (count($working_embeds) >= 4) break;
              $url = isset($embed_item['embedUrl']) ? trim((string) $embed_item['embedUrl']) : '';
              if ($url === '') continue;
              if (!flc_check_stream_url_alive($url)) continue;
              $working_embeds[] = $embed_item;
            }
            if (count($working_embeds) === 0 && count($embeds) > 0) {
              $working_embeds = array_slice($embeds, 0, 2);
            }
            $stream_keys = array('_fl_stream_url', '_fl_stream_url_2', '_fl_stream_url_3', '_fl_stream_url_4');
            $label_keys = array('_fl_stream_label', '_fl_stream_label_2', '_fl_stream_label_3', '_fl_stream_label_4');
            $lang_keys  = array('_fl_stream_language', '_fl_stream_language_2', '_fl_stream_language_3', '_fl_stream_language_4');
            foreach (array_merge($stream_keys, $label_keys, $lang_keys) as $k) {
              update_post_meta($post_id, $k, '');
            }
            $i = 0;
            foreach ($working_embeds as $embed_item) {
              if ($i >= count($stream_keys)) break;
              $url = isset($embed_item['embedUrl']) ? trim((string) $embed_item['embedUrl']) : '';
              if ($url === '') continue;
              update_post_meta($post_id, $stream_keys[$i], esc_url_raw($url));
              if (!empty($embed_item['label']) && is_string($embed_item['label'])) {
                update_post_meta($post_id, $label_keys[$i], sanitize_text_field($embed_item['label']));
              }
              if (!empty($embed_item['language']) && is_string($embed_item['language'])) {
                update_post_meta($post_id, $lang_keys[$i], sanitize_text_field($embed_item['language']));
              }
              if ($i === 0) {
                if (!empty($embed_item['matchTitle']) && is_string($embed_item['matchTitle'])) {
                  $parts = explode(' vs ', $embed_item['matchTitle']);
                  if (count($parts) === 2) {
                    update_post_meta($post_id, '_fl_home_team', sanitize_text_field($parts[0]));
                    update_post_meta($post_id, '_fl_away_team', sanitize_text_field($parts[1]));
                  }
                }
                if (!empty($embed_item['leagueName']) && is_string($embed_item['leagueName'])) {
                  update_post_meta($post_id, '_fl_league_name', sanitize_text_field($embed_item['leagueName']));
                }
              }
              $i++;
            }
            $primary_stream = trim((string) get_post_meta($post_id, '_fl_stream_url', true));
            if ($primary_stream !== '') {
              return;
            }
          }
        }
      }
    }
    $index_html = null;
    // If we have an index URL, try to auto-fill detail URL slots from it first
    if ($index) {
      $index_html = flc_http_get($index);
      if ($index_html) {
        flc_populate_detail_urls_from_index($post_id, $index, $index_html);
        // Refresh local detail URLs after auto-fill
        $detail  = esc_url_raw(trim((string) get_post_meta($post_id, '_fl_detail_url', true)));
        $detail2 = esc_url_raw(trim((string) get_post_meta($post_id, '_fl_detail_url_2', true)));
        $detail3 = esc_url_raw(trim((string) get_post_meta($post_id, '_fl_detail_url_3', true)));
        $detail4 = esc_url_raw(trim((string) get_post_meta($post_id, '_fl_detail_url_4', true)));
        $detail5 = esc_url_raw(trim((string) get_post_meta($post_id, '_fl_detail_url_5', true)));
        $detail6 = esc_url_raw(trim((string) get_post_meta($post_id, '_fl_detail_url_6', true)));
        $detail7 = esc_url_raw(trim((string) get_post_meta($post_id, '_fl_detail_url_7', true)));
        $detail8 = esc_url_raw(trim((string) get_post_meta($post_id, '_fl_detail_url_8', true)));
      }
    }

    // Build candidate detail URLs: primary, extras, plus all from index (up to 60)
    $candidates = array();
    $add_candidate = function($url) use (&$candidates) {
      $u = trim((string) $url);
      if ($u === '') return;
      if (!in_array($u, $candidates, true)) {
        $candidates[] = $u;
      }
    };

    $add_candidate($detail);
    $add_candidate($detail2);
    $add_candidate($detail3);
    $add_candidate($detail4);
    $add_candidate($detail5);
    $add_candidate($detail6);
    $add_candidate($detail7);
    $add_candidate($detail8);

    if ($index && $index_html) {
      $from_index = flc_extract_detail_urls_from_index_html($index, $index_html);
      if (is_array($from_index)) {
        foreach ($from_index as $u) {
          $add_candidate($u);
        }
      }
    }

    // Clear previous auto-filled stream URLs (user opted-in via checkbox)
    $stream_keys = array('_fl_stream_url', '_fl_stream_url_2', '_fl_stream_url_3', '_fl_stream_url_4');
    foreach ($stream_keys as $k) {
      update_post_meta($post_id, $k, '');
    }

    // Iterate all candidate detail pages, extract embed URL; only save if link is working (alive).
    $filled = 0;
    foreach ($candidates as $d_url) {
      if ($filled >= count($stream_keys)) break;
      list($p_home, $p_away, $p_stream, $p_league_name, $p_league_logo) = flc_extract_from_detail_url($d_url);
      $p_stream = trim((string) $p_stream);
      if ($p_stream === '') continue;
      if (!flc_check_stream_url_alive($p_stream)) continue;

      $stream_key = $stream_keys[$filled];
      update_post_meta($post_id, $stream_key, $p_stream);

      if ($filled === 0) {
        if ($p_home) update_post_meta($post_id, '_fl_home_team', $p_home);
        if ($p_away) update_post_meta($post_id, '_fl_away_team', $p_away);
        if ($p_league_name) update_post_meta($post_id, '_fl_league_name', $p_league_name);
        if ($p_league_logo) update_post_meta($post_id, '_fl_league_logo', $p_league_logo);
      }

      $filled++;
    }

    // If still no stream URL, keep as draft so it won't appear on homepage
    $final_stream = trim((string)get_post_meta($post_id, '_fl_stream_url', true));
    if ($final_stream === '') {
      // move to draft
      remove_action('save_post_match', 'flc_save_match_meta');
      wp_update_post(array('ID' => $post_id, 'post_status' => 'draft'));
      add_action('save_post_match', 'flc_save_match_meta');
    } else {
      // Set title if empty
      $final_home = get_post_meta($post_id, '_fl_home_team', true);
      $final_away = get_post_meta($post_id, '_fl_away_team', true);
      $wanted_title = trim($final_home . ' vs ' . $final_away);
      if ($wanted_title && get_the_title($post_id) !== $wanted_title) {
        remove_action('save_post_match', 'flc_save_match_meta');
        wp_update_post(array('ID' => $post_id, 'post_title' => $wanted_title));
        add_action('save_post_match', 'flc_save_match_meta');
      }
    }
  }

// Save handler for page stream meta (only handles stream URLs, no teams/league logic)
function flc_save_page_stream_meta($post_id) {
  if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
  if (!isset($_POST['flc_page_stream_meta_nonce']) || !wp_verify_nonce($_POST['flc_page_stream_meta_nonce'], 'flc_page_stream_meta_save')) return;
  if (!current_user_can('edit_post', $post_id)) return;

  // Block editor saves via REST and does not send this form – so we only run when nonce is present (classic form submit).
  $index  = isset($_POST['fl_index_url']) ? esc_url_raw(trim($_POST['fl_index_url'])) : '';
  $detail = isset($_POST['fl_detail_url']) ? esc_url_raw(trim($_POST['fl_detail_url'])) : '';
  $stream  = isset($_POST['fl_stream_url']) ? esc_url_raw(trim($_POST['fl_stream_url'])) : '';
  $detail2 = isset($_POST['fl_detail_url_2']) ? esc_url_raw(trim($_POST['fl_detail_url_2'])) : '';
  $detail3 = isset($_POST['fl_detail_url_3']) ? esc_url_raw(trim($_POST['fl_detail_url_3'])) : '';
  $detail4 = isset($_POST['fl_detail_url_4']) ? esc_url_raw(trim($_POST['fl_detail_url_4'])) : '';
  $stream2 = isset($_POST['fl_stream_url_2']) ? esc_url_raw(trim($_POST['fl_stream_url_2'])) : '';
  $stream3 = isset($_POST['fl_stream_url_3']) ? esc_url_raw(trim($_POST['fl_stream_url_3'])) : '';
  $stream4 = isset($_POST['fl_stream_url_4']) ? esc_url_raw(trim($_POST['fl_stream_url_4'])) : '';

  update_post_meta($post_id, '_fl_index_url', $index);
  update_post_meta($post_id, '_fl_detail_url', $detail);
  update_post_meta($post_id, '_fl_stream_url', $stream);
  update_post_meta($post_id, '_fl_detail_url_2', $detail2);
  update_post_meta($post_id, '_fl_detail_url_3', $detail3);
  update_post_meta($post_id, '_fl_detail_url_4', $detail4);
  update_post_meta($post_id, '_fl_stream_url_2', $stream2);
  update_post_meta($post_id, '_fl_stream_url_3', $stream3);
  update_post_meta($post_id, '_fl_stream_url_4', $stream4);

  $do_fetch = isset($_POST['fl_page_fetch_on_save']) && ($detail || $index);
  if ($do_fetch) {
    // First try external API (Next.js) using the index URL – same as Match, so Pages also get working embeds.
    if ($index && defined('FOOTBALL_LIVE_API_BASE')) {
      $api_url = trailingslashit(FOOTBALL_LIVE_API_BASE) . 'api/fetch-embeds-from-index';
      $resp = wp_remote_post($api_url, array(
        'timeout' => 25,
        'headers' => array('Content-Type' => 'application/json'),
        'body'    => wp_json_encode(array('indexUrl' => $index)),
      ));
      if (!is_wp_error($resp)) {
        $code = wp_remote_retrieve_response_code($resp);
        if ($code >= 200 && $code < 300) {
          $body = wp_remote_retrieve_body($resp);
          $data = json_decode($body, true);
          if (is_array($data) && !empty($data['ok']) && !empty($data['embeds']) && is_array($data['embeds'])) {
            $embeds = $data['embeds'];
            $working_embeds = array();
            foreach ($embeds as $embed_item) {
              if (count($working_embeds) >= 4) break;
              $url = isset($embed_item['embedUrl']) ? trim((string) $embed_item['embedUrl']) : '';
              if ($url === '') continue;
              if (!flc_check_stream_url_alive($url)) continue;
              $working_embeds[] = $embed_item;
            }
            if (count($working_embeds) === 0 && count($embeds) > 0) {
              $working_embeds = array_slice($embeds, 0, 2);
            }
            $stream_keys = array('_fl_stream_url', '_fl_stream_url_2', '_fl_stream_url_3', '_fl_stream_url_4');
            $label_keys = array('_fl_stream_label', '_fl_stream_label_2', '_fl_stream_label_3', '_fl_stream_label_4');
            $lang_keys  = array('_fl_stream_language', '_fl_stream_language_2', '_fl_stream_language_3', '_fl_stream_language_4');
            foreach (array_merge($stream_keys, $label_keys, $lang_keys) as $k) {
              update_post_meta($post_id, $k, '');
            }
            $i = 0;
            foreach ($working_embeds as $embed_item) {
              if ($i >= count($stream_keys)) break;
              $url = isset($embed_item['embedUrl']) ? trim((string) $embed_item['embedUrl']) : '';
              if ($url === '') continue;
              update_post_meta($post_id, $stream_keys[$i], esc_url_raw($url));
              if (!empty($embed_item['label']) && is_string($embed_item['label'])) {
                update_post_meta($post_id, $label_keys[$i], sanitize_text_field($embed_item['label']));
              }
              if (!empty($embed_item['language']) && is_string($embed_item['language'])) {
                update_post_meta($post_id, $lang_keys[$i], sanitize_text_field($embed_item['language']));
              }
              $i++;
            }
            $primary_stream = trim((string) get_post_meta($post_id, '_fl_stream_url', true));
            if ($primary_stream !== '') {
              return;
            }
          }
        }
      }
    }

    // Fallback: If we have an index URL, auto-fill detail URL slots from it
    $index_html = null;
    if ($index) {
      $index_html = flc_http_get($index);
      if ($index_html) {
        flc_populate_detail_urls_from_index($post_id, $index, $index_html);
        // Refresh local detail URLs after auto-fill
        $detail  = esc_url_raw(trim((string) get_post_meta($post_id, '_fl_detail_url', true)));
        $detail2 = esc_url_raw(trim((string) get_post_meta($post_id, '_fl_detail_url_2', true)));
        $detail3 = esc_url_raw(trim((string) get_post_meta($post_id, '_fl_detail_url_3', true)));
        $detail4 = esc_url_raw(trim((string) get_post_meta($post_id, '_fl_detail_url_4', true)));
      }
    }

    // Build candidate detail URLs for this Page
    $candidates = array();
    $add_candidate = function($url) use (&$candidates) {
      $u = trim((string) $url);
      if ($u === '') return;
      if (!in_array($u, $candidates, true)) {
        $candidates[] = $u;
      }
    };

    $add_candidate($detail);
    $add_candidate($detail2);
    $add_candidate($detail3);
    $add_candidate($detail4);

    if ($index && $index_html) {
      $from_index = flc_extract_detail_urls_from_index_html($index, $index_html);
      if (is_array($from_index)) {
        foreach ($from_index as $u) {
          $add_candidate($u);
        }
      }
    }

    // Clear previous auto-filled stream URLs
    $stream_keys = array('_fl_stream_url', '_fl_stream_url_2', '_fl_stream_url_3', '_fl_stream_url_4');
    foreach ($stream_keys as $k) {
      update_post_meta($post_id, $k, '');
    }

    // Only save stream URL if it responds (working); then only that many buttons show on page.
    $filled = 0;
    foreach ($candidates as $d_url) {
      if ($filled >= count($stream_keys)) break;
      list($_ph, $_pa, $p_stream) = flc_extract_from_detail_url($d_url);
      $p_stream = trim((string) $p_stream);
      if ($p_stream === '') continue;
      if (!flc_check_stream_url_alive($p_stream)) continue;

      $stream_key = $stream_keys[$filled];
      update_post_meta($post_id, $stream_key, $p_stream);
      $filled++;
    }
  }
}
add_action('save_post_page', 'flc_save_page_stream_meta');

// AJAX: Fetch streams for a page (used when block editor doesn't submit the Stream Links form)
function flc_ajax_fetch_page_streams() {
  check_ajax_referer('flc_fetch_page_streams', 'nonce');
  $post_id = isset($_POST['post_id']) ? absint($_POST['post_id']) : 0;
  if (!$post_id || !current_user_can('edit_post', $post_id)) {
    wp_send_json_error(array('error' => 'Permission denied.'));
  }
  $index_url = isset($_POST['fl_index_url']) ? esc_url_raw(trim($_POST['fl_index_url'])) : '';
  $detail_url = isset($_POST['fl_detail_url']) ? esc_url_raw(trim($_POST['fl_detail_url'])) : '';
  if ($index_url) {
    update_post_meta($post_id, '_fl_index_url', $index_url);
  }
  if ($detail_url) {
    update_post_meta($post_id, '_fl_detail_url', $detail_url);
  }
  $index = $index_url ?: trim((string) get_post_meta($post_id, '_fl_index_url', true));
  $detail = $detail_url ?: trim((string) get_post_meta($post_id, '_fl_detail_url', true));
  if (!$index && !$detail) {
    wp_send_json_error(array('error' => 'Enter Main Source URL or Match Page URL first.'));
  }
  $saved = flc_do_page_stream_fetch($post_id);
  wp_send_json_success(array('saved' => $saved));
}
add_action('wp_ajax_flc_fetch_page_streams', 'flc_ajax_fetch_page_streams');

/**
 * Run the stream fetch for a page (API then PHP fallback). Reads index/detail from meta.
 * Returns number of stream URLs saved (0–4).
 */
function flc_do_page_stream_fetch($post_id) {
  $index = trim((string) get_post_meta($post_id, '_fl_index_url', true));
  $detail = trim((string) get_post_meta($post_id, '_fl_detail_url', true));
  $detail2 = trim((string) get_post_meta($post_id, '_fl_detail_url_2', true));
  $detail3 = trim((string) get_post_meta($post_id, '_fl_detail_url_3', true));
  $detail4 = trim((string) get_post_meta($post_id, '_fl_detail_url_4', true));
  $stream_keys = array('_fl_stream_url', '_fl_stream_url_2', '_fl_stream_url_3', '_fl_stream_url_4');
  $label_keys = array('_fl_stream_label', '_fl_stream_label_2', '_fl_stream_label_3', '_fl_stream_label_4');
  $lang_keys  = array('_fl_stream_language', '_fl_stream_language_2', '_fl_stream_language_3', '_fl_stream_language_4');

  if ($index && defined('FOOTBALL_LIVE_API_BASE')) {
    $api_url = trailingslashit(FOOTBALL_LIVE_API_BASE) . 'api/fetch-embeds-from-index';
    $resp = wp_remote_post($api_url, array(
      'timeout' => 25,
      'headers' => array('Content-Type' => 'application/json'),
      'body'    => wp_json_encode(array('indexUrl' => $index)),
    ));
    if (!is_wp_error($resp)) {
      $code = wp_remote_retrieve_response_code($resp);
      if ($code >= 200 && $code < 300) {
        $body = wp_remote_retrieve_body($resp);
        $data = json_decode($body, true);
        if (is_array($data) && !empty($data['ok']) && !empty($data['embeds']) && is_array($data['embeds'])) {
          $embeds = $data['embeds'];
          $working_embeds = array();
          foreach ($embeds as $embed_item) {
            if (count($working_embeds) >= 4) break;
            $url = isset($embed_item['embedUrl']) ? trim((string) $embed_item['embedUrl']) : '';
            if ($url === '') continue;
            if (!flc_check_stream_url_alive($url)) continue;
            $working_embeds[] = $embed_item;
          }
          if (count($working_embeds) === 0 && count($embeds) > 0) {
            $working_embeds = array_slice($embeds, 0, 2);
          }
          foreach (array_merge($stream_keys, $label_keys, $lang_keys) as $k) {
            update_post_meta($post_id, $k, '');
          }
          $i = 0;
          foreach ($working_embeds as $embed_item) {
            if ($i >= count($stream_keys)) break;
            $url = isset($embed_item['embedUrl']) ? trim((string) $embed_item['embedUrl']) : '';
            if ($url === '') continue;
            update_post_meta($post_id, $stream_keys[$i], esc_url_raw($url));
            if (!empty($embed_item['label']) && is_string($embed_item['label'])) {
              update_post_meta($post_id, $label_keys[$i], sanitize_text_field($embed_item['label']));
            }
            if (!empty($embed_item['language']) && is_string($embed_item['language'])) {
              update_post_meta($post_id, $lang_keys[$i], sanitize_text_field($embed_item['language']));
            }
            $i++;
          }
          return $i;
        }
      }
    }
  }

  $index_html = null;
  if ($index) {
    $index_html = flc_http_get($index);
    if ($index_html) {
      flc_populate_detail_urls_from_index($post_id, $index, $index_html);
      $detail  = esc_url_raw(trim((string) get_post_meta($post_id, '_fl_detail_url', true)));
      $detail2 = esc_url_raw(trim((string) get_post_meta($post_id, '_fl_detail_url_2', true)));
      $detail3 = esc_url_raw(trim((string) get_post_meta($post_id, '_fl_detail_url_3', true)));
      $detail4 = esc_url_raw(trim((string) get_post_meta($post_id, '_fl_detail_url_4', true)));
    }
  }
  $candidates = array();
  $add = function($url) use (&$candidates) {
    $u = trim((string) $url);
    if ($u !== '' && !in_array($u, $candidates, true)) $candidates[] = $u;
  };
  $add($detail);
  $add($detail2);
  $add($detail3);
  $add($detail4);
  if ($index && $index_html) {
    $from_index = flc_extract_detail_urls_from_index_html($index, $index_html);
    if (is_array($from_index)) { foreach ($from_index as $u) { $add($u); } }
  }
  foreach ($stream_keys as $k) { update_post_meta($post_id, $k, ''); }
  $filled = 0;
  foreach ($candidates as $d_url) {
    if ($filled >= count($stream_keys)) break;
    list($_ph, $_pa, $p_stream) = flc_extract_from_detail_url($d_url);
    $p_stream = trim((string) $p_stream);
    if ($p_stream === '') continue;
    if (!flc_check_stream_url_alive($p_stream)) continue;
    update_post_meta($post_id, $stream_keys[$filled], $p_stream);
    $filled++;
  }
  return $filled;
}

// ----- Stream health checker (runs via WP-Cron every ~30 minutes) -----

function flc_check_stream_url_alive($url) {
  $url = trim((string) $url);
  if ($url === '') return false;
  $resp = wp_remote_head($url, array(
    'timeout' => 5,
    'redirection' => 3,
  ));
  if (is_wp_error($resp)) return false;
  $code = wp_remote_retrieve_response_code($resp);
  // Treat common success/redirect codes as "alive"
  $ok_codes = array(200, 301, 302, 303, 307, 308);
  return in_array($code, $ok_codes, true);
}

/**
 * Check if stream URL is alive, with short cache so we don't HEAD on every page view.
 * Used on match/page display so only working links get a button.
 */
function flc_is_stream_url_alive_cached($url) {
  $url = trim((string) $url);
  if ($url === '') return false;
  $key = 'fl_alive_' . md5($url);
  $cached = get_transient($key);
  if ($cached === '1') return true;
  if ($cached === '0') return false;
  $alive = flc_check_stream_url_alive($url);
  set_transient($key, $alive ? '1' : '0', 2 * MINUTE_IN_SECONDS);
  return $alive;
}

function flc_check_streams() {
  // Check both matches and pages that have any stream URL meta set
  $post_types = array('match', 'page');
  $meta_keys  = array(
    '_fl_stream_url',
    '_fl_stream_url_2',
    '_fl_stream_url_3',
    '_fl_stream_url_4',
    '_fl_stream_url_5',
    '_fl_stream_url_6',
    '_fl_stream_url_7',
    '_fl_stream_url_8',
  );

  $q = new WP_Query(array(
    'post_type'      => $post_types,
    'post_status'    => 'publish',
    'posts_per_page' => 50,
    'meta_query'     => array(
      'relation' => 'OR',
      array('key' => '_fl_stream_url',   'compare' => '!=', 'value' => ''),
      array('key' => '_fl_stream_url_2', 'compare' => '!=', 'value' => ''),
      array('key' => '_fl_stream_url_3', 'compare' => '!=', 'value' => ''),
      array('key' => '_fl_stream_url_4', 'compare' => '!=', 'value' => ''),
      array('key' => '_fl_stream_url_5', 'compare' => '!=', 'value' => ''),
      array('key' => '_fl_stream_url_6', 'compare' => '!=', 'value' => ''),
      array('key' => '_fl_stream_url_7', 'compare' => '!=', 'value' => ''),
      array('key' => '_fl_stream_url_8', 'compare' => '!=', 'value' => ''),
    ),
    'no_found_rows'  => true,
    'fields'         => 'ids',
  ));

  if (!$q->have_posts()) return;

  foreach ($q->posts as $post_id) {
    foreach ($meta_keys as $key) {
      $url = trim((string) get_post_meta($post_id, $key, true));
      if ($url === '') continue;
      if (!flc_check_stream_url_alive($url)) {
        // Clear dead stream so front-end hides it
        update_post_meta($post_id, $key, '');
      }
    }
  }
}
add_action('flc_check_streams_event', 'flc_check_streams');
}
add_action('save_post_match', 'flc_save_match_meta');

function flc_matches_shortcode($atts) {
  $atts = shortcode_atts(array(
    'status' => 'LIVE',
    'limit' => 10,
  ), $atts);
  $status = strtoupper(trim((string)$atts['status']));
  $limit = max(1, min(50, intval($atts['limit'])));

  $q = new WP_Query(array(
    'post_type' => 'match',
    'posts_per_page' => $limit,
    'post_status' => 'publish',
    'meta_key' => '_fl_status',
    'meta_value' => $status,
  ));

  if (!$q->have_posts()) return '<p class="muted">No matches.</p>';

  $out = '<div style="display:flex;flex-direction:column;gap:12px;">';
  while ($q->have_posts()) {
    $q->the_post();
    $id = get_the_ID();
    $home = get_post_meta($id, '_fl_home_team', true);
    $away = get_post_meta($id, '_fl_away_team', true);
    $home_logo = get_post_meta($id, '_fl_home_logo', true);
    $away_logo = get_post_meta($id, '_fl_away_logo', true);
    $league_name = get_post_meta($id, '_fl_league_name', true);
    $league_logo = get_post_meta($id, '_fl_league_logo', true);
    $league_color = get_post_meta($id, '_fl_league_color', true);
    $time = get_post_meta($id, '_fl_match_time', true);
    $stream = trim((string)get_post_meta($id, '_fl_stream_url', true));

    if ($stream === '') continue; // never show without stream

    $home_img = function_exists('football_live_get_team_logo_url') ? football_live_get_team_logo_url($home_logo) : $home_logo;
    $away_img = function_exists('football_live_get_team_logo_url') ? football_live_get_team_logo_url($away_logo) : $away_logo;

    $time_label = $status === 'LIVE' ? 'LIVE' : ($time ? esc_html($time) : '');

    $style = '';
    if ($league_color) {
      $style = ' style="--league:' . esc_attr($league_color) . ';"';
    }
    $title_line = trim(($home ?: 'Home') . ' vs ' . ($away ?: 'Away'));

    $out .= '<a class="match-card" href="' . esc_url(get_permalink($id)) . '"' . $style . '>';
    $out .=   '<div class="match-left">';
    if ($league_logo) {
      $out .= '<span class="league-badge"><img alt="" src="' . esc_url($league_logo) . '"></span>';
    }
    $out .=     '<div class="match-text">';
    $out .=       '<div class="match-title">' . esc_html($title_line) . '</div>';
    if ($league_name) {
      $out .=     '<div class="match-league-name">' . esc_html($league_name) . '</div>';
    }
    if ($time_label) {
      $out .=     '<div class="match-time"><span class="match-time-icon"></span><span>' . esc_html($time_label) . '</span></div>';
    }
    $out .=     '</div>'; // .match-text
    $out .=   '</div>'; // .match-left
    $out .=   '<span class="match-watch">Watch Now</span>';
    $out .= '</a>';
  }
  wp_reset_postdata();
  $out .= '</div>';
  return $out;
}
add_shortcode('football_live_matches', 'flc_matches_shortcode');

