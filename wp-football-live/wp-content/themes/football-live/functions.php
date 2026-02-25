<?php
if (!defined('ABSPATH')) { exit; }

define('FOOTBALL_LIVE_THEME_VERSION', '0.1.0');

function football_live_theme_enqueue_assets() {
  wp_enqueue_style('football-live-style', get_stylesheet_uri(), array(), FOOTBALL_LIVE_THEME_VERSION);
}
add_action('wp_enqueue_scripts', 'football_live_theme_enqueue_assets');

function football_live_theme_setup() {
  add_theme_support('title-tag');
  add_theme_support('post-thumbnails');
  add_theme_support('html5', array('search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script'));

  register_nav_menus(array(
    'primary' => __('Primary Menu', 'football-live'),
    'footer' => __('Footer Menu', 'football-live'),
  ));
}
add_action('after_setup_theme', 'football_live_theme_setup');

// Force our template for News/Football/Premier League so they always show category posts grid (not default page content)
function football_live_force_category_page_template($template) {
  if (!is_page()) return $template;
  $slug_map = array(
    'news' => 'page-news.php',
    'football' => 'page-football.php',
    'premier-league' => 'page-premier-league.php',
  );
  foreach ($slug_map as $slug => $file) {
    if (is_page($slug)) {
      $path = get_stylesheet_directory() . '/' . $file;
      if (file_exists($path)) return $path;
      break;
    }
  }
  return $template;
}
add_filter('template_include', 'football_live_force_category_page_template', 5);
add_filter('page_template', 'football_live_force_category_page_template', 5);

// No-cache for category pages so add/delete posts shows immediately
function football_live_no_cache_category_pages() {
  if (is_page(array('news', 'football', 'premier-league'))) {
    if (!defined('DONOTCACHEPAGE')) define('DONOTCACHEPAGE', true);
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
  }
}
add_action('template_redirect', 'football_live_no_cache_category_pages', 1);

function football_live_default_badge_url() {
  // Remote fallback so theme works without uploading images
  return 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=96&h=96&fit=crop';
}

function football_live_get_team_logo_url($maybe_url) {
  $u = trim((string)$maybe_url);
  if ($u === '') return football_live_default_badge_url();
  // Treat these as placeholders (show default image instead)
  if (stripos($u, 'ui-avatars.com') !== false) return football_live_default_badge_url();
  if (stripos($u, 'placehold.co') !== false) return football_live_default_badge_url();
  return esc_url($u);
}

