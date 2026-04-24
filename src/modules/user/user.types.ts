export interface IUser {
  name:                  string;
  email:                 string;
  password:              string;
  user_code:             string;
  hue:                   number;
  email_verified:        boolean;
  email_otp?:            string;
  email_otp_expires_at?: Date;
  created_at:            Date;
  updated_at:            Date;
}
