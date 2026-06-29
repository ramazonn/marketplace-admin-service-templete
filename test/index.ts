import * as admin from 'firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';

require('dotenv').config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const message = {
  token:
    'f3YbiQWm7UMLpK5d8sEUmc:APA91bGKb9V1QH4xpMRQfOWmHifltVjwR3xRF-E9JGMb4j_2KHbrej0lfriKg5GVMh_n8iyukO6ZF1WOPsDbVuojZbKuGcSlTG6Z90TVb1eHzq7LdsiGKnI',
  notification: {
    title: 'test title',
    body: 'test description',
  },
};
try {
  for (let i = 0; i < 4; i++) {
    getMessaging()
      .send(message)
      .then((response) => {
        console.log('Successfully sent message:', response);
      });
  }
} catch (error) {
  console.error(error);
}
