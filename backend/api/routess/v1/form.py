from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from datetime import datetime, timedelta

from api.extensions import db
from api.helpers.tools import error_response, log_timeline_event
from api.models import FormContainer, Form, Response, Question
from api.schemas import ResponseSchema, FormSchema, FormSchemaSQL
from api.routess.auth_decorators import require_valid_app_ids, require_user_token

from workflow.email_manager import MailManager

form_bp = Blueprint("form_bp", __name__)


@form_bp.route('/forms/<int:form_id>', methods=['GET'])
@require_valid_app_ids(param_name="app_id", source="args", allow_multiple=False)
def get_form_by_id(form_id):
    """
    Retrieve a form by its ID.
    """
    form = Form.query.get_or_404(form_id)
    schema = FormSchemaSQL(session=db.session)
    return jsonify(schema.dump(form)), 200


@form_bp.route('/forms/<int:form_id>/submit-response', methods=['POST'])
@require_valid_app_ids(param_name="app_id", source="json", allow_multiple=False)
def submit_form_response(form_id):
    data = request.json
    responder_uid = getattr(request, 'user_id', None)
    answers_summary = []

    if not responder_uid:
        return error_response("User not authenticated", 401)

    access_token = data.get('access_token')
    form_container = FormContainer.query.filter_by(access_token=access_token).first_or_404()
    if form_container.validated:
        return error_response("Form container already validated", 401)

    form = Form.query.filter_by(id=form_id, form_container_id=form_container.id).first_or_404()

    if form.status == 'answered':
        return error_response("Form already answered", 401)

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
    log_timeline_event(form_container.id, form.id, 'Response submitted',
                       f'Response submitted for form ID {form_id} by {responder_uid}')
    db.session.commit()
    if form_container.escalate:
        MailManager.send_email(form_container.application.mail_sender, form_container.user_email,
                               form_container.cc_emails, form_container.title,
                               access_token, questions=answers_summary)
    return jsonify({"message": "Response submitted successfully"}), 200

@form_bp.route('/users', methods=['GET'])
def get_users():
    search_query = request.args.get('search', '').strip().lower()

    if len(search_query) < 3:
        return jsonify([])  # Pas de recherche si < 3 caractères

    emails = [{"user_id": "d76476", "email": "test@hafsa.com", "manager_email": "manager-test@hafsa.com", 'full_name': 'hafsa raii'}, {
        "user_id": "fff", "email": "test1@hafsa.com", "manager_email": "manager-test1@hafsa.com", "full_name": 'test RAII'}]


    return jsonify([
        {"email": user["email"], "user_id": user["user_id"], "manager_email": user["manager_email"], "full_name": user["full_name"]}
        for user in emails
    ])
