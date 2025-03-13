;(function ($) {
    $('.btn-wishlish').on('click', function (e) {
        e.preventDefault();

        var postID = $(this).data('post-id');

        $.ajax({
            url: travilaAjax.ajax_url,
            type: 'POST',
            data: {
                action: 'travila_add_to_wishlist',
                post_id: postID
            },
            success: function (response) {
                if (response.success) {
                    alert('Added to wishlist!');
                }
            }
        });
    });


    // Remove from wishlist
    $(document).on('click', '.remove-from-wishlist', function (e) {
        e.preventDefault();
        console.log('ok');

        var postID = $(this).data('post-id');

        $.ajax({
            url: travilaAjax.ajax_url,
            type: 'POST',
            data: {
                action: 'travila_remove_from_wishlist',
                post_id: postID
            },
            success: function (response) {
                if (response.success) {
                    alert('Removed from wishlist!');
                    location.reload(); // Refresh the page to update the wishlist
                }
            }
        });
    });
})(jQuery);
