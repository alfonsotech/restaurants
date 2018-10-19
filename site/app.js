 
// ===================================================
// GLOBAL VARS
// ===================================================
let map;
let restaurantMarker;
const restaurantsArray = [];
let markersArray = [];
let filteredArray = [];

// ===================================================
// CREATE GOOGLE MAP ON PAGE
// ===================================================
function initMap() {

	// Try to access HTML5 geolocation in users browser
  if (navigator.geolocation) {
    // Get user position
    navigator.geolocation.getCurrentPosition(function(position) {
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      // Create new instance of Google Map, placed in #map div
			map = new google.maps.Map(document.getElementById("map"), {
				center: pos,
				zoom: 11
			});

      // Place Marker at user position in map
      const userMarker = new google.maps.Marker({position: pos, map: map});

      // Call to get JSON data into array
      getRestaurants();

    }, function() { // <---- second function passed into navigator.geolocation
      handleLocationError(true, infoWindow, map.getCenter());
    });

  // If browser doesn't support Geolocation
  } else {
    handleLocationError(false, infoWindow, map.getCenter());
  }
} // <---- Close of initMap

// Geolocation error function
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
	infoWindow.setPosition(pos);
	infoWindow.setContent(browserHasGeolocation ?
                      'Error: The Geolocation service failed.' :
                      'Error: Your browser doesn\'t support geolocation.');
	infoWindow.open(map);
}

// ===================================================
// GET RESTAURANT JSON DATA AND PLACE IN ARRAY
// ===================================================
function getRestaurants() {

  $.getJSON('https://res.cloudinary.com/tami-mcinnis-photography/raw/upload/v1539375486/list.json', function(data) {
      $.each(data, function() {
        restaurantsArray.push(this);
      });
      renderRestaurants(restaurantsArray);
  });
}

// ===================================================
// RATINGS FILTER
// ===================================================
// on mouseover change img to full star
$(".filterStar").mouseenter(function() {
  $(".filterStar").on("mouseout", function() {
      $(".filterStar").attr("src", "images/emptyStar.png");
      starRatingHolder = 0;
  });
  $(".filterStar").attr("src", "images/emptyStar.png");
  $(this).prevAll().attr("src", "images/star.png");
  $(this).attr("src", "images/star.png");
});

// on mouseout change back to empty star
$(".filterStar").mouseout(function() {
  $(".filterStar").attr("src", "images/emptyStar.png");
});

// on click keep those stars filled
let starRatingHolder = 0;
$(".filterStar").click(function() {
  $(this).prevAll().attr("src", "images/star.png");
  $(this).attr("src", "images/star.png");
  starRatingHolder = $(this).attr("data-rating");
  $(".filterStar").off("mouseout");
});

// Filter visable results based on star rating
$("#filterResults").click(function() {
  // reset filteredArray
  filteredArray = [];
  // remove previous restaurantMarkers
  $.each(markersArray, function() {
    this.setMap(null);
  })
  // for each restaurant from original array, push to filteredArray if rating is high enough
  $.each(restaurantsArray, function() {
    if (this.ratingsAvg >= starRatingHolder) {
      filteredArray.push(this);
    }
  // rerender restaurants based on filteredArray
  renderRestaurants(filteredArray);    
  });
});

// ===================================================
// CALCULATE AVG RATING FOR EACH RESTAURANT
// ===================================================
// Pass data into function that will come from restaurantArray
function avgRat(restaurants) {
  $.each(restaurants, function() {
    // Reset temp rating storage
    let r = 0;
    let avg;
    // For each rating in this.restaurantsArray add value to storage
    $.each(this.ratings, function() {
      r += this.stars;
    });
    // Calcualte avg from temp storage to 1 decimals
    avg = r/this.ratings.length;
    this.ratingsAvg = Math.round(avg);
    // Return number of reviews
    return rCount = " (" + this.ratings.length + ")";
  });
} 

// ===================================================
// RENDER RESTAURANTS ARRAY ON MAP AND IN LIST
// ===================================================
function renderRestaurants(restaurants) {
  // Local vars
  let restaurantList = '<ul>';
  let restaurantWindow = new google.maps.InfoWindow;

  // For each restaurant in array
  $.each(restaurants, function() {

    // Run an average of the ratings and store in array
    const starIcon = '<img src="images/star.png" class="star">';
    avgRat(restaurants);

    // ---------------------------------------------
    // RENDER STARS FOR AVG RATINGS
    // ---------------------------------------------    
    let s = '';
    for (var i = 0; i < this.ratingsAvg; i++) {
      s += starIcon;
    }
    starCount = '<span class="starRow">' + s + '</span>';

    // ---------------------------------------------
    // DEFINE RESTAURANT DETAILS FOR LIST ON SIDE
    // ---------------------------------------------
    restaurantList += '<li id="' + '">' + this.restaurantName + '<br>' + this.cuisine + '<br>' + this.address + '<br>' + starCount + rCount + '</li>' + '<br>';

    // ---------------------------------------------
    // CREATE CONTENT FOR INFO WINDOW
    // ---------------------------------------------
    let infoContentString = '<h1>' + this.restaurantName + '</h1>' + '<p>' + this.cuisine + '</p>' + '<p>' + starCount + rCount + '</p>';

    // ---------------------------------------------
    // CREATE MARKER ON MAP
    // ---------------------------------------------

    // Get each review for restaurant with starIcons
    let reviewsGroup= '';
    let reviewDiv;
    let tempComment = '';
    // For each restaurant being run over, run through each rating
    $.each(this.ratings, function (){
      // Store comment
      tempComment = this.comment
      // Create certain number of stars per review
      let st = '';
      for(var j = 0; j < this.stars; j++) {
        st += starIcon;
      }
      // write comment and stars as string
      reviewDiv = '<div class="reviewDetail"><div>' + st + '</div><p>' + tempComment + '</p></div>';
      reviewsGroup += reviewDiv;
    });

    // Create custom marker icon
    forkIcon = {
        url: 'images/marker.png',
        scaledSize: new google.maps.Size(35, 35)
    };

    // Create new marker from coordinates
    let restaurantMarker = new google.maps.Marker({
      position: {lat: this.lat, lng: this.long},
      map: map,
      icon: forkIcon,
      restaurantName: this.restaurantName,
      cuisine: this.cuisine,
      address: this.address,
      streetView: '<img class="streetview" src="https://maps.googleapis.com/maps/api/streetview?size=400x400&location=' + this.lat + ',' + this.long + '&fov=90&heading=235&pitch=10&key=AIzaSyAbulWAsl7TTbNtnz891RutUSCA89IHKQA">',
      website: this.website,
      ratingsAvg: this.ratingsAvg,
      starCount: starCount,
      rCount: rCount,
      ratings: reviewsGroup 
    });

    // ---------------------------------------------
    // EVENT LISTENERS ON MARKERS AND MAP
    // ---------------------------------------------
    // Event listener on restaurantMarkers, will place/open the infoWindow on Marker
    restaurantMarker.addListener("mouseover", function() {
      restaurantWindow.setPosition(this.Marker);
      restaurantWindow.setContent(infoContentString);
      restaurantWindow.open(map, this);
    });

    // Event listener on restaurantMarkers, will close the infoWindow on Marker
    restaurantMarker.addListener("mouseout", function() {
      restaurantWindow.close();
    });

    // Event listener on restaurantMarkers, will open details pane when clicked
    restaurantMarker.addListener("click", detailsExpand);
      
    // Push restaurantMarker to separate array
    markersArray.push(restaurantMarker);
  }); //<----- End of restaurantsArray $.each

  // Event listener for map click
  google.maps.event.addListener(map, 'click', addRestaurant);

  // Close restaurant List and insert
  restaurantList += '</ul>';
  document.getElementById("listResults").innerHTML = restaurantList;  
}  //<----- End of renderRestaurants()

// ---------------------------------------------
// EXPAND DETAILS OF RESTAURANT WHEN MARKER CLICKED
// ---------------------------------------------
function detailsExpand() {
  // Hide restaurant list
  $("#listModal").css("display", "none");

  // Define clicked restaurants details
  let modalDetails = '<h1>' + this.restaurantName + '</h1>' + '<p>' + this.cuisine  + '</p>' + this.starCount + this.rCount + '<button id="addReview">Add Review</button>' + '<p>' + this.website + '</p>' + '<p>' + this.address + '</p>' + this.streetView + '<p>' + this.ratings + '</p>';

  // Insert and show restaurants details into side panel
  document.getElementById("restaurantModalContent").innerHTML = modalDetails;
  $("#restaurantModal").css("display", "block");

  // Event listener on restaurantMarkers, will close details pane when clicked
  $("#restaurantModalClose").on("click", function() {
    $("#restaurantModal").css("display", "none");
    $("#listModal").css("display", "block");
  });

  $("#addReview").on("click", addReview);
}

// ---------------------------------------------
// FUNCTION TO ADD NEW RESTAURANT
// ---------------------------------------------
function addRestaurant(event) {
  // insert func to reset form here <========

  // Cancel button listener
  $("#newRestaurantModalCancel").on("click", function() {
    $("#newRestaurantModal").css("display", "none");
  });

  // vars for newRestaurant
  let newName;
  let cuisineType;
  let newAddress;
  let newLat = event.latLng.lat();
  let newLong = event.latLng.lng();
  let x;

  // Show new Restaurant modal as overlay
  $("#newRestaurantModal").css("display", "block");

  // Event listener on submit button, will submit to restaurantsArray and close modal
  $("#newRestaurantModalSubmit").on("click", function() {
    // form values transfer over here
    newName = document.getElementById("newName").value;
    newAddress = document.getElementById("newAddress").value;
    cuisineType = document.getElementById("cuisineType").value;
    // Create new instance of newRestaurant and push to restaurantsArray
    x = new NewRestaurant(newName, newAddress, cuisineType, newLat, newLong);
    restaurantsArray.push(x);
    // Close modal
    $("#newRestaurantModal").css("display", "none");
    renderRestaurants(restaurantsArray);
  });  
}

// new Restaurant Object
function NewRestaurant(name, address, cuisine, lat, long) {
  this.restaurantName = name;
  this.address = address;
  this.cuisine = cuisine;
  this.website = "<a href= 'http://www.website.com'>www.website.com</a>";
  this.lat = lat;
  this.long = long;
  this.ratings = [];
  this.ratingsAvg = 0;
}






// Fix star filter so that ratings of 0 show after filter is run once


// ---------------------------------------------
// ADD RESTAURANT ON BUTTON CLICK
// ---------------------------------------------
// User clicks ADD RESTO
// Bring up addResto modal form
// shows fields for: resto name, cuisine type, star rating, comments.
// Also has submit button
// on click submit, form validates fields
// finds lat lng of clicked area to add streetview photo
// adds content to restaurantsArray
// reruns renderRestaurants with restaurants array passed



// manually bind "this" to owned object


// MARKER CLICK REPLACES LIST WITH EXPANDED INFO ON RESTO
  // currently list pulled from marker properties


