import { SendEmailPayload } from "../email.types.js";

export interface IEmailProvider {
  send(payload: SendEmailPayload): Promise<void>;
}
