import { useNotifications } from './notifications-store';
import { cn } from '@/utils/cn';

const typeStyles = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800',
};

export const Notifications = () => {
  const { notifications, dismissNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            'rounded-lg border p-4 shadow-md',
            typeStyles[notification.type],
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-sm">{notification.title}</p>
              {notification.message && (
                <p className="text-xs mt-1 opacity-80">
                  {notification.message}
                </p>
              )}
            </div>
            <button
              onClick={() => dismissNotification(notification.id)}
              className="text-current opacity-50 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
