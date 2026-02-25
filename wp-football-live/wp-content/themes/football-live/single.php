<?php
if (!defined('ABSPATH')) { exit; }
get_header();

while (have_posts()) : the_post();
  $hero = has_post_thumbnail() ? get_the_post_thumbnail_url(get_the_ID(), 'full') : 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&q=80';
?>

<main class="container section">
  <div class="glass-card" style="padding:16px;">
    <div class="post-thumb" style="margin-bottom:14px;">
      <img alt="" src="<?php echo esc_url($hero); ?>">
    </div>
    <h1 style="margin:0 0 10px;"><?php the_title(); ?></h1>
    <div class="muted" style="font-size:13px;margin-bottom:18px;">
      By <?php echo esc_html(get_the_author()); ?> · <?php echo esc_html(get_the_date()); ?>
    </div>
    <div style="line-height:1.7;color:#e5e5e5;">
      <?php the_content(); ?>
    </div>
  </div>
</main>

<?php endwhile; ?>
<?php get_footer(); ?>

