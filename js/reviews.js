let _controller;
function ReviewsController() {
  this.restaurant_id = parseInt(Utils.getParam('id'));
  document.getElementById('cancel-btn')
      .addEventListener('click', () => location = `restaurant.html?id=${this.restaurant_id}`);
  this.form = document.getElementById('review');
  DBHelper.fetchRestaurantById(this.restaurant_id,
    (error, data) => {
      if(data)
        this.fillBreadcrumb(data);
    }
  );
}
function submitReview(event) {
  event.preventDefault();
  const data = new Review(_controller.restaurant_id, _controller.form.elements);
  DBHelper.postReview(data, (postedReview) => {
    _controller.form.reset();
    if(postedReview)
      location.replace(`${location.origin}/restaurant.html?id=${postedReview.restaurant_id}`);
  });
  return false;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
ReviewsController.prototype.fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  let li = document.createElement('li');
  const link = document.createElement('a');
  link.href = `${location.origin}/restaurant.html?id=${restaurant.id}`;
  link.textContent = restaurant.name;
  li.appendChild(link);
  breadcrumb.appendChild(li);
  // create last breadcrumb
  li = document.createElement('li');
  li.setAttribute('aria-current', 'page');
  li.textContent = document.getElementsByTagName('title')[0].innerText;
  breadcrumb.appendChild(li);
};

function Review(id, data) {
  this.restaurant_id = id;
  this.name = data.name.value ? data.name.value : data.name;
  this.rating = data.rating.value ? data.rating.value : data.rating;
  this.comments = data.comments.value ? data.comments.value : data.comments;
}

window.addEventListener('DOMContentLoaded', () => _controller = new ReviewsController());
