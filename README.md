# README #
# ubay-admin-api #

### Current microservice is responsible for the followings: ###
* All APIs related to auth.
* All APIs related to cards.
* **Firebase Cloud Messaging (FCM) notifications** with multi-language support
* **Language-based notifications** for users (Uzbek, Russian, English)
* **Automatic notification sending** for order updates, review responses, chat messages, and news

## 🚀 **Notification Service Features**

### **Multi-Language Support**
- **Uzbek (uz)** - Full Uzbek translations
- **Russian (ru)** - Full Russian translations  
- **English (en)** - Default fallback language

### **Automatic Notifications**
- **Order Status Changes** - Users get notified when their order status updates
- **Review Responses** - Users get notified when admins respond to their reviews
- **Chat Messages** - Users get notified when they receive new chat messages
- **News Broadcasts** - All users get notified about new news in their preferred language

### **Language-Based News Notifications**
```typescript
// Send news to all users with language support
const notificationService = new NotificationTemplateService();

// Using TranslatesSchema for multi-language support
await notificationService.sendNewsNotification(
    {
        en: "New Product Available!",
        ru: "Новый продукт доступен!",
        uz: "Yangi mahsulot mavjud!"
    },
    {
        en: "Check out our latest product with amazing features...",
        ru: "Посмотрите наш последний продукт с удивительными функциями...",
        uz: "Bizning eng so'nggi mahsulotimizni ajoyib xususiyatlar bilan ko'ring..."
    },
    { newsId: "123", deepLink: "products" }
);

// HTML content in body will be automatically:
// 1. Stripped of all HTML tags
// 2. Cleaned of extra whitespace
// 3. Truncated to 200 characters
// 4. '...' added for better notification display
```

## 🔧 **Setup**

### **Environment Variables**
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### **Firebase Initialization**
Firebase Admin SDK is automatically initialized when the application starts.

## 📱 **Usage Examples**

### **Send Order Status Notification**
```typescript
await notificationService.sendOrderUpdateNotification(
    userId, 
    orderId, 
    OrderStatusEnum.SHIPPED
);
```

### **Send Review Response Notification**
```typescript
await notificationService.sendReviewResponseNotification(
    userId, 
    reviewId, 
    "Thank you for your feedback!"
);
```

### **Send Chat Message Notification**
```typescript
await notificationService.sendChatMessageNotification(
    userId, 
    "Hello! How can I help you?",
    chatId
);
```

Written with ❤️ by ubaytools team.

### **Environment File Generation**
```bash
base64 -w 0 .env  # Linux/macOS
base64 .env | tr -d '\n'  # Windows
```
