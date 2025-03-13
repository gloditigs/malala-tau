;(function($){
    "use strict";

    // Function to get existing URL parameters and convert them to an object
    window.getUrlParams = () => {
        const params = new URLSearchParams(window.location.search);
        let paramObject = {};
        for (let [key, value] of params.entries()) {
            paramObject[key] = value;
        }
        return paramObject;
    }

    // Function to set new URL parameters and reload the page
    window.updateUrlParams = (newParams) => {
        const baseUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        const newQueryString = new URLSearchParams(newParams).toString();
        const decodedQueryString = decodeURIComponent(newQueryString);
        window.location.href = `${baseUrl}?${decodedQueryString}`;
    }

    // Function to handle checkbox input changes
    function handleCheckboxChange() {
        const urlParams = getUrlParams(); // Get the existing URL params

        // Collect selected checkbox values
        let selectedLocations = [];
        let selectedCategories = [];
        let selectedRatings = [];
        let selectedAmenities = [];
        let selectedHoteltypes = [];
        let selectedRoomtypes = [];
        let selectedCartAmenities = [];
        let selectedCartModels = [];
        let selectedCarttypes = [];
        let selectedFueltypes = [];



        // Collect checked car amneties
        document.querySelectorAll('input[name="tr_ba_car-amenities"]:checked').forEach(el => {
            selectedCartAmenities.push(el.value);
        });

        // Collect checked car fuel types
        document.querySelectorAll('input[name="tr_ba_fuel-type"]:checked').forEach(el => {
            selectedFueltypes.push(el.value);
        });

        // Collect checked car types
        document.querySelectorAll('input[name="tr_ba_car-type"]:checked').forEach(el => {
            selectedCarttypes.push(el.value);
        });

        // Collect checked car models
        document.querySelectorAll('input[name="tr_ba_car-models"]:checked').forEach(el => {
            selectedCartModels.push(el.value);
        });

        // Collect checked locations
        document.querySelectorAll('input[name="tr_locations"]:checked').forEach(el => {
            selectedLocations.push(el.value);
        });

        // Collect checked categories
        document.querySelectorAll('input[name="tr_categories"]:checked').forEach(el => {
            selectedCategories.push(el.value);
        });

        // Collect checked ratings
        document.querySelectorAll('input[name="tr_rating"]:checked').forEach(el => {
            selectedRatings.push(el.value);
        });

        // Collect checked amenities
        document.querySelectorAll('input[name="tr_ba_amenities"]:checked').forEach(el => {
            selectedAmenities.push(el.value);
        });

        // Collect checked hotel types
        document.querySelectorAll('input[name="tr_ba_hotel-types"]:checked').forEach(el => {
            selectedHoteltypes.push(el.value);
        });

        // Collect checked room style
        document.querySelectorAll('input[name="tr_ba_room-style"]:checked').forEach(el => {
            selectedRoomtypes.push(el.value);
        });

        // Update URL params based on selected values
        if (selectedLocations.length > 0) {
            urlParams['tr_locations'] = selectedLocations.join(','); // Append as comma-separated values
        } else {
            delete urlParams['tr_locations']; // Remove param if no locations are selected
        }

        if (selectedCategories.length > 0) {
            urlParams['tr_categories'] = selectedCategories.join(','); // Append as comma-separated values
        } else {
            delete urlParams['tr_categories']; // Remove param if no categories are selected
        }

        if (selectedRatings.length > 0) {
            urlParams['tr_rating'] = selectedRatings.join(','); // Append as comma-separated values
        } else {
            delete urlParams['tr_rating']; // Remove param if no ratings are selected
        }

        if (selectedAmenities.length > 0) {
            urlParams['tr_ba_amenities'] = selectedAmenities.join(','); // Append as comma-separated values
        } else {
            delete urlParams['tr_ba_amenities']; // Remove param if no ratings are selected
        }

        if (selectedHoteltypes.length > 0) {
            urlParams['tr_ba_hotel-types'] = selectedHoteltypes.join(','); // Append as comma-separated values
        } else {
            delete urlParams['tr_ba_hotel-types']; // Remove param if no ratings are selected
        }

        if (selectedRoomtypes.length > 0) {
            urlParams['tr_ba_room-style'] = selectedRoomtypes.join(','); // Append as comma-separated values
        } else {
            delete urlParams['tr_ba_room-style']; // Remove param if no ratings are selected
        }
        if (selectedCartAmenities.length > 0) {
            urlParams['tr_ba_car-amenities'] = selectedCartAmenities.join(','); // Append as comma-separated values
        } else {
            delete urlParams['tr_ba_car-amenities']; // Remove param if no ratings are selected
        }

        if (selectedCartModels.length > 0) {
            urlParams['tr_ba_car-models'] = selectedCartModels.join(','); // Append as comma-separated values
        } else {
            delete urlParams['tr_ba_car-models']; // Remove param if no ratings are selected
        }

        if (selectedCarttypes.length > 0) {
            urlParams['tr_ba_car-type'] = selectedCarttypes.join(','); // Append as comma-separated values
        } else {
            delete urlParams['tr_ba_car-type']; // Remove param if no ratings are selected
        }

        if (selectedFueltypes.length > 0) {
            urlParams['tr_ba_fuel-type'] = selectedFueltypes.join(','); // Append as comma-separated values
        } else {
            delete urlParams['tr_ba_fuel-type']; // Remove param if no ratings are selected
        }


        // Reload the page with the new URL parameters
        updateUrlParams(urlParams);
    }

    // Event listeners for checkboxes
    document.querySelectorAll('.list-filter-checkbox input[type="checkbox"]').forEach(el => {
        el.addEventListener('change', handleCheckboxChange);
    });

    $(".tr-guests-dropdown").on('click', function(event){
        event.stopPropagation();
    });

    document.addEventListener("DOMContentLoaded", function () {
        const dropdown = document.querySelector(".tr-guests-dropdown");
        if(dropdown == null){
            return;
        }
        const dropdownToggle = dropdown.querySelector(".tr-guest-counts");

        const guestCounts = {
            adults: 1,
            children: 0,
            youth: 0
        };

        // Update the button label with current counts
        function updateDropdownLabel() {
            const { adults, children, youth } = guestCounts;
            dropdownToggle.innerHTML = `${adults} adults, ${children} children, ${youth} youth`;
            document.querySelector("input[name='tr_guests']").value = adults + children + youth;
        }

        // Handle plus and minus button clicks
        dropdown.querySelectorAll(".tr-guests-dropdown .dropdown-item").forEach(item => {
            const minusBtn = item.querySelector(".tr-minus");
            const plusBtn = item.querySelector(".tr-plus");
            const countElem = item.querySelector(".tr-count");
            const type = item.querySelector(".text-sm-bold").innerText.toLowerCase(); // adults, children, youth

            minusBtn.addEventListener("click", () => {
                if (guestCounts[type] > 0) {
                    guestCounts[type]--;
                    countElem.innerHTML = guestCounts[type];
                    updateDropdownLabel();
                }
            });

            plusBtn.addEventListener("click", () => {
                guestCounts[type]++;
                countElem.innerHTML = guestCounts[type];
                updateDropdownLabel();
            });
        });

        // Initial setup
        updateDropdownLabel();
    });

    document.addEventListener("DOMContentLoaded", function () {
        const dropdown = document.querySelector(".tr-location-dropdown");
        if(dropdown == null){
            return;
        }
        const dropdownToggle = dropdown.querySelector(".location-search");
        const locationLinks = dropdown.querySelectorAll(".tr-locations");
        const hiddenInput = dropdown.querySelector("input[name='tr_locations']");

        // Function to handle location selection
        locationLinks.forEach(link => {
            link.addEventListener("click", function (e) {
                e.preventDefault(); // Prevent default link behavior
                const selectedLocationName = this.getAttribute("data-location");
                const selectedLocation = this.getAttribute("href");

                // Update the button text and hidden input value
                dropdownToggle.innerHTML = selectedLocationName;
                hiddenInput.value = selectedLocation;
            });
        });
    });


    // search filter 1
    $('.location-link').each(function(){
        $(this).on('click', function(){
            let location = $(this).data('value');
            $('input[name="tr_locations"]').val(location);
        });
    });

    $('.duration-link').each(function(){
        $(this).on('click', function(){
            let duration = $(this).data('value');
            $('input[name="duration"]').val(duration);
        });
    });

    $('.order-link').each(function(){
        $(this).on('click', function(){
            let order = $(this).data('value');
            $('input[name="order_by"]').val(order);
        });
    });

    $('.price-link').each(function(){
        $(this).on('click', function(){
            let min = $(this).data('min');
            let max = $(this).data('max');
            $('input[name="min_price"]').val(min);
            $('input[name="max_price"]').val(max);
        });
    });

    $('.lang-link').each(function(){
        $(this).on('click', function(){
            let lang = $(this).data('value');
            $('input[name="language"]').val(lang);
        });
    });

    $('.sort-by-link').each(function(){
        $(this).on('click', function(){
            let sortBy = $(this).data('value');
            $('input[name="sort_by"]').val(sortBy);
        });
    });

    $('.category-link').each(function(){
        $(this).on('click', function(){
            let category = $(this).data('value');
            $('input[name="tr_categories"]').val(category);
        });
    });


    $('.item-sort .dropdown-item').each(function(){
        $(this).on('click', function(){
            let text = $(this).text();
            $('.dropdown-toggle span').text(text);
            let sort = $(this).data('value');
            let currentUrl = new URL(window.location.href);

            // Update or add the 'order_by' parameter with the value from data-value
            currentUrl.searchParams.set('order_by', sort);

            // Set the updated URL back (this reloads the page with the new URL)
            window.location.href = currentUrl.href;
        });
    });


})(jQuery);
