<?php
if (!defined('ABSPATH')) { exit; }
get_header();

while (have_posts()) : the_post();
  $post_id = get_the_ID();
  $home = get_post_meta($post_id, '_fl_home_team', true);
  $away = get_post_meta($post_id, '_fl_away_team', true);

  // Collect up to 4 stream URLs + button labels (Server N - Language) from meta.
  $streams = array();
  $labels  = array();
  for ($i = 1; $i <= 4; $i++) {
    $meta_key = ($i === 1) ? '_fl_stream_url' : '_fl_stream_url_' . $i;
    $lang_key = ($i === 1) ? '_fl_stream_language' : '_fl_stream_language_' . $i;
    $url = trim((string) get_post_meta($post_id, $meta_key, true));
    if ($url === '') continue;
    $streams[] = $url;
    $language = trim((string) get_post_meta($post_id, $lang_key, true));
    $label = 'Server ' . $i;
    if ($language !== '') {
      $label .= ' - ' . ucfirst($language);
    }
    $labels[] = $label;
  }
  $current_stream = isset($streams[0]) ? $streams[0] : '';

  // Time limit: if "Stream ends at" is set and past, hide stream.
  $stream_ends_at = trim((string) get_post_meta($post_id, '_fl_stream_ends_at', true));
  $stream_expired = false;
  if ($stream_ends_at !== '') {
    $ends_ts = strtotime($stream_ends_at);
    if ($ends_ts !== false && $ends_ts < time()) {
      $stream_expired = true;
      $streams = array();
      $labels = array();
      $current_stream = '';
    }
  }
?>

<main class="container section">
  <?php if (!empty($streams)) : ?>
    <?php if (count($streams) > 1) : ?>
      <div class="stream-switcher">
        <?php foreach ($streams as $idx => $url) : ?>
          <button
            type="button"
            class="stream-link-btn<?php echo $idx === 0 ? ' is-active' : ''; ?>"
            data-stream="<?php echo esc_attr($url); ?>"
          >
            <?php echo esc_html($labels[$idx]); ?>
          </button>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>

    <div class="iframe-wrap">
      <div class="ratio">
        <iframe
          class="match-stream-iframe"
          src="<?php echo esc_url($current_stream); ?>"
          allowfullscreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          title="<?php echo esc_attr(($home ?: 'Home') . ' vs ' . ($away ?: 'Away')); ?>"
        ></iframe>
      </div>
    </div>
  <?php elseif ($stream_expired) : ?>
    <div class="iframe-wrap">
      <div class="ratio" style="display:flex;align-items:center;justify-content:center;color:#888;background:#111;">
        Stream has ended
      </div>
    </div>
  <?php else : ?>
    <div class="iframe-wrap">
      <div class="ratio" style="display:flex;align-items:center;justify-content:center;color:#888;background:#111;">
        Stream not available
      </div>
    </div>
  <?php endif; ?>

  <div style="margin-top:16px;">
    <a class="text-primary" href="<?php echo esc_url(home_url('/')); ?>">← Back to Home</a>
  </div>
</main>

<?php endwhile; ?>
<?php get_footer(); ?>

<script>
document.addEventListener('DOMContentLoaded', function () {
  const iframe = document.querySelector('.match-stream-iframe');
  if (!iframe) return;
  const buttons = document.querySelectorAll('.stream-link-btn');
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const url = this.getAttribute('data-stream');
      if (!url) return;
      iframe.setAttribute('src', url);
      buttons.forEach(function (b) { b.classList.remove('is-active'); });
      this.classList.add('is-active');
    });
  });
});
</script>

