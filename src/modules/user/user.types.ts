export interface INotificationPrefs {
  assigned: boolean;
  mentions: boolean;
  comments: boolean;
  status:   boolean;
  weekly:   boolean;
}

export interface IUser {
  name:                  string;
  email:                 string;
  password?:             string;
  provider:              "local" | "google";
  googleId?:             string;
  user_code:             string;
  hue:                   number;
  avatar?:               string;
  notification_prefs:    INotificationPrefs;
  email_verified:        boolean;
  email_otp?:            string;
  email_otp_expires_at?: Date;
  created_at:            Date;
  updated_at:            Date;
}
