declare module "zeptomail" {
  interface EmailAddress {
    address: string;
    name?: string;
  }

  interface SendMailInput {
    from: EmailAddress;
    to: Array<{
      email_address: EmailAddress;
    }>;
    subject: string;
    htmlbody?: string;
    textbody?: string;
  }

  export class SendMailClient {
    constructor(options: { url: string; token: string });
    sendMail(input: SendMailInput): Promise<unknown>;
  }
}
