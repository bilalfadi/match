<?php
if (!defined('ABSPATH')) { exit; }
?>

<footer class="site-footer footer">
  <div class="container" style="padding:48px 16px;">
    <div class="footer-grid">
      <div>
        <a class="brand" href="<?php echo esc_url(home_url('/')); ?>" style="font-size:18px;">
          <span class="text-primary">⚽</span>
          <span><?php bloginfo('name'); ?></span>
        </a>
        <p class="muted" style="margin:12px 0 0;max-width:420px;">
          Watch live football matches and stay updated with the latest news from the world of football.
        </p>
      </div>
      <?php if (has_nav_menu('footer')) : ?>
      <div>
        <h3 style="margin:0 0 10px;"><?php esc_html_e('Links', 'football-live'); ?></h3>
        <?php
          wp_nav_menu(array(
            'theme_location' => 'footer',
            'container'      => false,
            'menu_class'     => 'footer-links',
          ));
        ?>
      </div>
      <?php else : ?>
      <div>
        <h3 style="margin:0 0 10px;">Content</h3>
        <div class="footer-links">
          <a href="<?php echo esc_url(home_url('/')); ?>">Home</a>
          <a href="<?php echo esc_url(home_url('/premier-league/')); ?>">Premier League</a>
          <a href="<?php echo esc_url(home_url('/football/')); ?>">Football</a>
          <a href="<?php echo esc_url(home_url('/news/')); ?>">News</a>
        </div>
      </div>
      <div>
        <h3 style="margin:0 0 10px;">Legal</h3>
        <div class="footer-links">
          <a href="<?php echo esc_url(home_url('/about/')); ?>">About Us</a>
          <a href="<?php echo esc_url(home_url('/disclaimer/')); ?>">Disclaimer</a>
          <a href="<?php echo esc_url(home_url('/terms/')); ?>">Terms &amp; Conditions</a>
          <a href="<?php echo esc_url(home_url('/privacy/')); ?>">Privacy Policy</a>
          <a href="<?php echo esc_url(home_url('/cookies/')); ?>">Cookies Policy</a>
          <a href="<?php echo esc_url(home_url('/ccpa/')); ?>">CCPA</a>
          <a href="<?php echo esc_url(home_url('/contact/')); ?>">Contact Us</a>
        </div>
      </div>
      <?php endif; ?>
    </div>

    <div style="margin-top:24px;padding-top:24px;border-top:1px solid var(--border);text-align:center;" class="muted">
      © <?php echo esc_html(date('Y')); ?> <?php bloginfo('name'); ?>. All rights reserved.
    </div>
  </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>

