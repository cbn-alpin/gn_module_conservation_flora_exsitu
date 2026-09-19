import logging
import smtplib

from email.message import EmailMessage

from flask import current_app

from gn_module_conservation_flora_exsitu import MODULE_CODE


log = logging.getLogger(__name__)


def get_mail_config():
    module_config = current_app.config.get(
        MODULE_CODE,
        {}
    )

    return module_config.get(
        "mail",
        {}
    )


def send_mail(
    recipients,
    subject,
    body,
):
    mail_config = get_mail_config()

    smtp_host = mail_config.get("smtp_host")
    smtp_port = mail_config.get("smtp_port", 465)
    smtp_ssl = mail_config.get("smtp_ssl", True)
    smtp_user = mail_config.get("smtp_user")
    smtp_password = mail_config.get("smtp_password")
    sender = mail_config.get("sender") or smtp_user

    log.info(
        "[MAIL] Configuration chargée : "
        "host=%s port=%s ssl=%s user=%s password=%s sender=%s",
        smtp_host or "ABSENT",
        smtp_port,
        smtp_ssl,
        "OK" if smtp_user else "ABSENT",
        "OK" if smtp_password else "ABSENT",
        "OK" if sender else "ABSENT",
    )

    log.info(
        "[MAIL] Préparation de l'envoi vers %s destinataire(s)",
        len(recipients or []),
    )

    if not smtp_host:
        raise RuntimeError(
            "MAIL : smtp_host non configuré"
        )

    if not smtp_user:
        raise RuntimeError(
            "MAIL : smtp_user non configuré"
        )

    if not smtp_password:
        raise RuntimeError(
            "MAIL : smtp_password non configuré"
        )

    if not sender:
        raise RuntimeError(
            "MAIL : sender non configuré"
        )

    if not recipients:
        raise ValueError(
            "MAIL : aucun destinataire"
        )

    message = EmailMessage()

    message["From"] = sender
    message["To"] = ", ".join(recipients)
    message["Subject"] = subject

    message.set_content(body)

    try:

        if smtp_ssl:

            log.info(
                "[MAIL] Connexion SMTP SSL à %s:%s",
                smtp_host,
                smtp_port,
            )

            with smtplib.SMTP_SSL(
                smtp_host,
                smtp_port,
                timeout=20,
            ) as smtp:

                log.info(
                    "[MAIL] Connexion SMTP établie"
                )

                smtp.login(
                    smtp_user,
                    smtp_password,
                )

                log.info(
                    "[MAIL] Authentification Yahoo réussie"
                )

                smtp.send_message(message)

        else:

            log.info(
                "[MAIL] Connexion SMTP à %s:%s",
                smtp_host,
                smtp_port,
            )

            with smtplib.SMTP(
                smtp_host,
                smtp_port,
                timeout=20,
            ) as smtp:

                smtp.starttls()

                log.info(
                    "[MAIL] TLS activé"
                )

                smtp.login(
                    smtp_user,
                    smtp_password,
                )

                log.info(
                    "[MAIL] Authentification Yahoo réussie"
                )

                smtp.send_message(message)

        log.info(
            "[MAIL] Mail envoyé avec succès"
        )

    except Exception:
        log.exception(
            "[MAIL] Échec de l'envoi SMTP"
        )

        raise