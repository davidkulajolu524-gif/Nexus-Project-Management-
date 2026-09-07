import os

from dotenv import load_dotenv
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema

load_dotenv()


mail_config = ConnectionConfig(
    MAIL_USERNAME=os.getenv("SMTP_USERNAME"),
    MAIL_PASSWORD=os.getenv("SMTP_PASSWORD"),
    MAIL_FROM=os.getenv("SMTP_FROM"),
    MAIL_PORT=465,
    MAIL_SERVER="smtp.gmail.com",

    # Gmail port 465 uses implicit SSL/TLS.
    MAIL_STARTTLS=False,
    MAIL_SSL_TLS=True,

    USE_CREDENTIALS=True,
)


mail = FastMail(mail_config)


async def send_email(
    recipient: str,
    subject: str,
    body: str,
) -> None:
    message = MessageSchema(
        subject=subject,
        recipients=[recipient],
        body=body,
        subtype="plain",
    )

    await mail.send_message(message)
