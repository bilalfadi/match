<?php
if (!defined('ABSPATH')) { exit; }
get_header();
?>

<main class="container section">
  <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
    <?php
      // Only show buttons for stream URLs that respond (alive). 1 working = 1 button, etc.
      $streams = array();
      $labels  = array();
      $button_index = 0;
      for ($i = 1; $i <= 4; $i++) {
        $meta_key = ($i === 1) ? '_fl_stream_url' : '_fl_stream_url_' . $i;
        $lang_key = ($i === 1) ? '_fl_stream_language' : '_fl_stream_language_' . $i;
        $url = trim((string) get_post_meta(get_the_ID(), $meta_key, true));
        if ($url === '') continue;
        if (function_exists('flc_is_stream_url_alive_cached') && !flc_is_stream_url_alive_cached($url)) continue;
        $button_index++;
        $streams[] = $url;
        $language = trim((string) get_post_meta(get_the_ID(), $lang_key, true));
        $label = 'Server ' . $button_index;
        if ($language !== '') {
          $label .= ' - ' . ucfirst($language);
        }
        $labels[] = $label;
      }
      $current_stream = isset($streams[0]) ? $streams[0] : '';
    ?>

    <?php if (!empty($streams)) : ?>
      <div class="stream-switcher">
        <span class="stream-switcher-label">Stream</span>
        <?php foreach ($streams as $idx => $url) : ?>
          <button
            type="button"
            class="stream-link-btn<?php echo $idx === 0 ? ' is-active' : ''; ?>"
            data-stream="<?php echo esc_attr($url); ?>"
          >
            <span class="stream-btn-dot" aria-hidden="true"></span>
            <span class="stream-btn-text"><?php echo esc_html($labels[$idx]); ?></span>
          </button>
        <?php endforeach; ?>
      </div>

      <div class="iframe-wrap iframe-below-switcher" style="margin-bottom:18px;">
        <div class="ratio">
          <iframe
            class="page-stream-iframe"
            src="<?php echo esc_url($current_stream); ?>"
            allowfullscreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title="<?php echo esc_attr(get_the_title()); ?>"
          ></iframe>
        </div>
      </div>
    <?php endif; ?>

    <div class="glass-card" style="padding:18px;">
      <h1 style="margin:0 0 14px;"><?php the_title(); ?></h1>
      <div style="line-height:1.7;color:#e5e5e5;">
        <?php the_content(); ?>
      </div>
    </div>
  <?php endwhile; endif; ?>
</main>

<script>
document.addEventListener('DOMContentLoaded', function () {
  const iframe = document.querySelector('.page-stream-iframe');
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

<?php get_footer(); ?>

