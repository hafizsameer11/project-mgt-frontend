import api from './api';

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications are not supported in this browser');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Get public key from server
      const response = await api.get<{ publicKey: string }>('/push/public-key');
      const publicKey = response.data.publicKey;

      if (!publicKey) {
        console.error('VAPID public key not available');
        return false;
      }

      // Check if already subscribed
      this.subscription = await this.registration.pushManager.getSubscription();

      if (!this.subscription) {
        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('Notification permission denied');
          return false;
        }

        // Subscribe to push notifications
        this.subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(publicKey),
        });

        // Send subscription to server
        await this.sendSubscriptionToServer(this.subscription);
      }

      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  async unsubscribe(): Promise<void> {
    if (this.subscription) {
      await this.subscription.unsubscribe();
      await this.sendUnsubscribeToServer(this.subscription);
      this.subscription = null;
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
      },
    };

    try {
      await api.post('/push/subscribe', subscriptionData);
      console.log('Subscription sent to server');
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }

  private async sendUnsubscribeToServer(subscription: PushSubscription): Promise<void> {
    try {
      await api.post('/push/unsubscribe', { endpoint: subscription.endpoint });
      console.log('Unsubscription sent to server');
    } catch (error) {
      console.error('Error sending unsubscription to server:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

export const pushNotificationService = new PushNotificationService();

