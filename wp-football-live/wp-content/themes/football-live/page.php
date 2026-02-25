<?php
if (!defined('ABSPATH')) { exit; }
get_header();
?>

<main class="container section">
  <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
    <?php
      // If this page has stream links from the plugin, show player above the content.
      $streams = array();
      $labels  = array();
      // Front-end pe sirf 4 links dikhayenge (Link 1–4)
      for ($i = 1; $i <= 4; $i++) {
        $meta_key = ($i === 1) ? '_fl_stream_url' : '_fl_stream_url_' . $i;
        $url = trim((string) get_post_meta(get_the_ID(), $meta_key, true));
        if ($url === '') continue;
        $streams[] = $url;
        $labels[]  = 'Link ' . $i;
      }
      $current_stream = isset($streams[0]) ? $streams[0] : '';
    ?>

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

      <div class="iframe-wrap" style="margin-bottom:18px;">
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

