{questions: Array(3)}{
  "formContainer": {
    "id": 2,
    "title": "Feedback sur le produit",
    "userEmail": "user@example.com",
    "managerEmail": "manager@example.com",
    "reference": "TICKET-5678",
    "escalate": true,
    "initiatedBy": "admin@example.com",
    "validated": false,
    "createdAt": "2024-11-01T10:00:00Z",
    "updatedAt": "2024-11-02T15:00:00Z",
    "forms": [
      {
        "formId": 1,
        "status": "answered",
        "questions": [
          {
            "id": 1,
            "label": "Que pensez-vous de la qualité du produit?",
            "type": "text",
            "options": [],
            "isRequired": true,
            "response": "La qualité est correcte."
          },
          {
            "id": 2,
            "label": "Choisissez une caractéristique importante",
            "type": "multipleChoice",
            "options": ["Prix", "Performance", "Design"],
            "isRequired": true,
            "response": "Performance"
          }
        ],
        "responses": [
          {
            "userId": "user-456",
            "submittedAt": "2024-11-01T11:00:00Z",
            "answers": [
              {
                "questionId": 1,
                "response": "La qualité est correcte."
              },
              {
                "questionId": 2,
                "response": "Performance"
              }
            ]
          }
        ]
      },
      {
        "formId": 2,
        "status": "open",
        "linkedTo": 1,
        "reasonForAdditionalForm": "Réponse insuffisante sur la qualité du produit.",
        "questions": [
          {
            "id": 3,
            "label": "Pouvez-vous détailler pourquoi vous trouvez la qualité correcte?",
            "type": "text",
            "options": [],
            "isRequired": true
          }
        ],
        "responses": []
      }
    ],
    "timeline": [
      {
        "event": "Form created",
        "timestamp": "2024-11-01T10:00:00Z",
        "details": "Initial form created by admin@example.com"
      },
      {
        "event": "User response submitted",
        "timestamp": "2024-11-01T11:00:00Z",
        "details": "User submitted initial form responses."
      },
      {
        "event": "Admin requested additional details",
        "timestamp": "2024-11-02T10:00:00Z",
        "details": "Admin created a follow-up form for more detailed feedback."
      },
      {
        "event": "Reminder sent",
        "timestamp": "2024-11-02T12:00:00Z",
        "details": "Reminder sent to user to complete the follow-up form."
      }
    ]
  }
}
