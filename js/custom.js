// Carousel change interval
$('.carousel').carousel({
  interval: 3000
});

// Smooth anchor scroll - It's a paid feature of MDB so I use JS to do it
// https://stackoverflow.com/questions/7717527/smooth-scrolling-when-clicking-an-anchor-link
let anchorlinks = document.querySelectorAll('a[href*=\\#]:not([href$=\\#])');

for (let item of anchorlinks) { // relitere
  item.addEventListener('click', (e)=> {
    let hashval = item.getAttribute('href');
    let target = document.querySelector(hashval);
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
    history.pushState(null, null, hashval);
    e.preventDefault()
  })
}

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
  let message = author + " wrote the following message:\n\n" + text;

  let validEmail = validateEmail(email);

  if (!validEmail) {
    window.alert('Email not valid.');
  } else {
    window.location.href = "mailto:ialonsolonso@yahoo.es"
                         + "?cc=" + encodeURIComponent(email)
                         + "&subject=" + encodeURIComponent(subject)
                         + "&body=" + encodeURIComponent(message);
  }
}

function validateEmail(email) {
  let regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/g;

  return regex.test(email);
}