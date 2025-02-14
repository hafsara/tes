from flask import Blueprint, request, jsonify
from api.models import FormContainer, Form, Question, Response
from api.extensions import db
from api.schemas import FormSchema, QuestionSchema, ResponseSchema
from api.decorators.auth import authenticate_request
from marshmallow import ValidationError

from api.helpers.tools import log_timeline_event, error_response
from workflow.email_manager import MailManager

form_bp = Blueprint('form', __name__)
form_schema = FormSchema()
question_schema = QuestionSchema()
response_schema = ResponseSchema()


@form_bp.before_request
def before_request():
    return authenticate_request()


@form_bp.route('/<int:form_id>', methods=['GET'])
def get_form_by_id(form_id):
    form = Form.query.get_or_404(form_id)
    result = form_schema.dump(form)
    return jsonify(result), 200


@form_bp.route('/<int:form_id>/submit-response', methods=['POST'])
def submit_response(form_id):
    """
    Submit a response to a form.
    """
    data = request.json
    responder_uid = getattr(request, 'user_id', None)
    answers_summary = []

    if not responder_uid:
        return error_response( "User not authenticated", 401)

    form = Form.query.get_or_404(form_id)
    form_container = FormContainer.query.get_or_404(form.form_container_id)

    if form_container.validated:
        return error_response( "Form container already validated", 401)

    if form.status == 'answered':
        return error_response( "Form already answered", 401)

    try:
        for question_data in data.get('questions', []):
            question_schema.load(question_data)
    except ValidationError as err:
        return error_response( err.messages, 400)

    response_record = Response(
        form_id=form.id,
        responder_uid=responder_uid,
        answers=[]
    )

    for question_data in data.get('questions', []):
        question_id = question_data.get('id')
        response_content = question_data.get('response')
        question = Question.query.filter_by(id=question_id, form_id=form.id).first_or_404()
        question.response = response_content
        response_record.answers.append({
            "questionId": question.id,
            "response": response_content
        })
        answers_summary.append({'label': question.label, "response": response_content, "type": question.type})

    form.responses.append(response_record)
    form.status = 'answered'
    db.session.commit()

    log_timeline_event(form_container.id, form.id, 'Response submitted',
                       f'Response submitted for form ID {form_id} by {responder_uid}')
    db.session.commit()

    mail_sender = 'hafsa@test.com'  # TODO: Get mail_sender from app_id or form_container
    MailManager.send_email(mail_sender, form_container.user_email, form_container.cc_emails, form_container.title,
                           form_container.access_token, questions=answers_summary)
    result = response_schema.dump(response_record)
    return jsonify({"message": "Response submitted successfully", "response": result}), 200
