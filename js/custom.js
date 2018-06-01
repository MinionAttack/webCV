// Carousel change interval
$('.carousel').carousel({
  interval: 3000
});

//Smooth anchor scroll - It's a paid feature of MDB so I use JS to do it
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();

    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

// Google Maps
function showMap() {
  let map = new google.maps.Map(document.getElementById('map-container'), {zoom: 13});
  let geocoder = new google.maps.Geocoder;
  geocoder.geocode({'address': 'La Coruña'}, function (results, status) {
    if (status === 'OK') {
      map.setCenter(results[0].geometry.location);
      new google.maps.Marker({
        map: map,
        position: results[0].geometry.location
      });
    } else {
      window.alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

// Contact Form
function sendMail() {
  let author = document.getElementById('contactNameInput').value;
  let email = document.getElementById('contactEmailInput').value;
  let subject = document.getElementById('contactSubjectInput').value;
  let text = document.getElementById('contactMessageInput').value;
  let message = author + "wrote the following message: " + text;

  let validEmail = validateEmail(email);

  if (validEmail) {
    let link = "mailto:ialonsolonso@yahoo.es"
      + "?cc=" + encodeURIComponent(email)
      + "&subject=" + encodeURIComponent(subject)
      + "&body=" + encodeURIComponent(message);

    window.location.href = link;
  } else {
    window.alert('Email not valid.');
  }
}

function validateEmail(email) {
  let regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/g;

  return regex.test(email);
}