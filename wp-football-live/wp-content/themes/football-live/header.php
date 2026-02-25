<?php
if (!defined('ABSPATH')) { exit; }
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header class="site-header">
  <div class="container nav">
    <a class="brand" href="<?php echo esc_url(home_url('/')); ?>">
      <span class="text-primary">⚽</span>
      <span><?php bloginfo('name'); ?></span>
    </a>
    <nav class="nav-links">
      <?php
        if (has_nav_menu('primary')) {
          wp_nav_menu(array(
            'theme_location' => 'primary',
            'container'      => false,
            'menu_class'     => 'nav-links',
            'fallback_cb'    => false,
          ));
        }
        if (!has_nav_menu('primary')) {
          $links = array(
            array('href' => home_url('/'), 'label' => 'Home'),
            array('href' => home_url('/premier-league/'), 'label' => 'Premier League'),
            array('href' => home_url('/football/'), 'label' => 'Football'),
            array('href' => home_url('/news/'), 'label' => 'News'),
          );
          foreach ($links as $l) {
            echo '<a href="' . esc_url($l['href']) . '">' . esc_html($l['label']) . '</a>';
          }
        }
      ?>
    </nav>
  </div>
</header>

