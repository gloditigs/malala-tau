(function ($) {
    ("use strict");
    $(".noUi-handle").on("click", function () {
        $(this).width(50);
    });
    function rangeSlider(){
        var rangeSlider = document.getElementById("slider-range");
        var rangeSlider2 = $("#slider-range");

        if (rangeSlider2.length > 0) {
            var moneyFormat = wNumb({
                decimals: 0,
                thousand: ",",
                prefix: ""
            });
            noUiSlider.create(rangeSlider, {
                start: $('.box-value-price').data('range'),
                tooltips: [wNumb({decimals: 0})],
                step: 1,
                range: {
                    min: 0,
                    max: $('.box-value-price').data('max')
                },
                format: moneyFormat,
                connect: 'lower',
                //connect: true
            });

            // Set visual min and max values and also update value hidden form inputs
            rangeSlider.noUiSlider.on("update", function (values, handle) {
                let val = values[0]? values[0]: 0;
                $(".value-money").val(val);
            });

            // Trigger event when the user releases the mouse button
            rangeSlider.noUiSlider.on("set", function (values, handle) {
                const minPrice = $('input[name="min_price"]').val();
                const maxPrice = values[0]? values[0]: 0;

                const params = new URLSearchParams(window.location.search);

                // Update URL parameters with min and max price values
                params.set('min_price', minPrice);
                params.set('max_price', maxPrice);

                // Function to update the URL parameters without reloading the page
                updateUrlParams(params);
            });
        }
    }

    rangeSlider();

    $(window).on("elementor/frontend/init", function () {
		elementorFrontend.hooks.addAction(
			"frontend/element_ready/booking-price-filter.default",rangeSlider
		);
    });
})(jQuery);