from prefect import flow, task

from email_manager import send_email
from models import FormContainer

class FormWorkflowManager:
    def __init__(self, container_id):
        self.container_id = container_id

    @task
    def send_initial_notification_task(self):
        form_container = FormContainer.query.get(self.container_id)
        if form_container:
            send_email(
                to=form_container.user_email,
                subject="New Form Notification",
                body=f"A new form has been created with the title: {form_container.title}.",
                link=form_container.access_token
            )
            print("Initial notification sent.")

    @task
    def send_reminder_task(self):
        form_container = FormContainer.query.get(self.container_id)
        if form_container:
            send_email(
                to=form_container.user_email,
                subject="Reminder: Please Complete Your Form",
                body=f"This is a reminder to complete the form: {form_container.title}.",
                link=form_container.access_token
            )
            print("Reminder sent.")

    @task
    def escalate_task(self):
        form_container = FormContainer.query.get(self.container_id)
        if form_container and form_container.manager_email:
            send_email(
                to=form_container.manager_email,
                subject="Escalation: Form Not Completed",
                body=f"The user has not completed the form: {form_container.title}. Please check.",
                link=form_container.access_token
            )
            print("Escalation notification sent.")

    @flow(name="DelayedFormWorkflow")
    def delayed_workflow(self):
        """Workflow for delayed tasks: reminders and escalation."""
        reminder = self.send_reminder_task()
        self.escalate_task(wait_for=[reminder])

    @flow(name="ImmediateNotificationWorkflow")
    def immediate_notification_flow(self):
        """Flow for sending the initial notification immediately."""
        self.send_initial_notification_task()

    def start_delayed_workflow(self):
        # Run the delayed workflow (reminders and escalation)
        self.delayed_workflow()
