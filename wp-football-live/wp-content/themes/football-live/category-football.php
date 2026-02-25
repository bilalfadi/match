<?php
if (!defined('ABSPATH')) { exit; }
get_header();
$hero_bg = 'https://images.unsplash.com/photo-1522778119026-d647f0596c4c?w=1920&q=80';
$paged = max(1, get_query_var('paged'));
?>
<section class="hero">
  <div class="hero-bg" style="background-image:url('<?php echo esc_url($hero_bg); ?>')"></div>
  <div class="hero-overlay"></div>
  <div class="container hero-inner">
    <h1>World Football</h1>
    <p>Stories from leagues around the world – fixtures, results and more.</p>
  </div>
</section>
<main class="container section">
  <header class="section-title">
    <h2><span class="text-primary">▌</span> World Football</h2>
  </header>
  <div class="grid grid-3">
    <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
      <article class="glass-card post-card">
        <a href="<?php the_permalink(); ?>">
          <div class="post-thumb">
            <?php if (has_post_thumbnail()) : ?>
              <?php the_post_thumbnail('large'); ?>
            <?php else: ?>
              <img alt="" src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&q=80" />
            <?php endif; ?>
          </div>
          <h3 class="post-title"><?php the_title(); ?></h3>
          <p class="post-excerpt"><?php echo esc_html(wp_trim_words(get_the_excerpt(), 22)); ?></p>
          <div class="post-meta"><?php echo esc_html(get_the_date()); ?></div>
        </a>
      </article>
    <?php endwhile; ?>
    <?php
      $wp_query = $GLOBALS['wp_query'];
      if ($wp_query->max_num_pages > 1) :
    ?>
      <div class="pagination-wrap" style="margin-top:24px; grid-column:1/-1;">
        <?php echo paginate_links(array('total' => $wp_query->max_num_pages, 'current' => $paged)); ?>
      </div>
    <?php endif; ?>
    <?php else: ?>
      <p class="muted">No posts in this category yet.</p>
    <?php endif; ?>
  </div>
</main>
<?php get_footer(); ?>
