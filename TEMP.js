// Run this script ONCE to populate existing orders

async function populateOrderIds() {
    try {
        const orders = await Order.find({ orderId: { $exists: false } }); // Find orders without orderId

        let nextId = 1;
        if (orders.length > 0) {
          const lastOrder = await Order.findOne({}, { orderId: 1 }, { sort: { orderId: -1 } }).exec();
          nextId = lastOrder ? lastOrder.orderId + 1 : 1;
        }
        

        for (const order of orders) {
            order.orderId = nextId++;
            await order.save();
            console.log(`Updated order ${order._id} with orderId ${order.orderId}`);
        }

        console.log('All orders updated!');
    } catch (error) {
        console.error('Error populating order IDs:', error);
    } finally {
        mongoose.disconnect(); // Disconnect after the script is done
    }
}
const uri = 'mongodb+srv://devang-p12:Devang%401203@canteencluster.tetyg.mongodb.net/?retryWrites=true&w=majority&appName=CanteenCluster';

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to MongoDB");
        populateOrderIds();
    })
    .catch(err => {
        console.error("Could not connect to MongoDB", err);
    });
