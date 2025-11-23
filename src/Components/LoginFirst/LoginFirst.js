//     // // src/Components/LoginFirst/LoginFirst.js


/**
 * LoginFirst is an OOP helper class that:
 * 1. Handles redirects if the user is not logged in.
 * 2. Shows popup messages below navbar if not logged in or after action success.
 * 3. All messages are stored inside the class — no need to pass them manually.
 */
export default class LoginFirst {
  constructor(user, safeNavigate, setNotification = null) {
    this.user = user;
    this.safeNavigate = safeNavigate;
    this.setNotification = setNotification;

    // Messages stored in the class
    this.messages = {
      loginRequiredFavorite: "Please log in to add to your favorites",
      loginRequiredCart: "Please log in to add to your bag",
      addedToFavorite: "Product added to your favorites!",
      addedToCart: "Product added to your bag!",
    };
  }

  /**
   * General in-page redirect + popup
   * @param {string} targetPath
   * @param {string} message
   */
  inPageRedirect(targetPath, message) {
    if (this.setNotification) {
      this.setNotification(message);
      setTimeout(() => this.setNotification(null), 3000);
    }

    if (!this.user) {
      this.safeNavigate("/login", {
        state: {
          showLoginPopup: true,
          redirectTo: targetPath,
          popupMessage: message,
        },
      });
    } else {
      this.safeNavigate(targetPath);
    }
  }

  /**
   * Redirect to Favorites with internal messages
   */
  redirectToFavorites(isAdded = false) {
    const message = isAdded
      ? this.messages.addedToFavorite
      : this.messages.loginRequiredFavorite;
    this.inPageRedirect("/favorites", message);
  }

  /**
   * Redirect to Cart/Bag with internal messages
   */
  redirectToCart(isAdded = false) {
    const message = isAdded
      ? this.messages.addedToCart
      : this.messages.loginRequiredCart;
    this.inPageRedirect("/bag_page", message);
  }

}