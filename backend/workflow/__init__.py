from flask import render_template
from jinja2 import Template


def send_summary():
    # Example of a dynamic form with different types of questions
    questions = [
        {"label": "What is your name?", "response": "John Doe", "type": "text"},
        {"label": "What is your favorite color?", "response": "Blue", "type": "dropdown"},
        {"label": "What are your hobbies?", "response": ["Reading", "Traveling"], "type": "checkbox"},
        {"label": "Do you agree with the terms?", "response": "Yes", "type": "radio"},
    ]

    # Dynamic URL for the form
    form_url = "https://example.com/form"
    with open("templates/summary_mail.html") as file:
        template_content = file.read()

    # Créer un objet Template
    template = Template(template_content)

    # Render the HTML template with the questions
    html_message = template.render(questions=questions, form_url=form_url)

    return html_message

if __name__ == "__main__":
    print(send_summary())
