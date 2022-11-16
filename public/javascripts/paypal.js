paypal
  .Buttons({
    // Sets up the transaction when a payment button is clicked
    createOrder: (data, actions) => {
      return actions.order.create({
        purchase_units: [
          {
            amount: {
              value: getTotal(), // Can also reference a variable or function
            },
          },
        ],
      });
    },

    onApprove: (data, actions) => {
      return actions.order.capture().then(function (orderData) {
        console.log(
          "Capture result",
          orderData,
          JSON.stringify(orderData, null, 2)
        );
        const transaction = orderData.purchase_units[0].payments.captures[0];
        // alert(`Transaction ${transaction.status}: ${transaction.id}\n\nSee console for all available details`);
        $(document).ready(function () {
          $("#placeOrder").trigger("click");
        });
      });
    },
  })
  .render("#paypal-button-container");
