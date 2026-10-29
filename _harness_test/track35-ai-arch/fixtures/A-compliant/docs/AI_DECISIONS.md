Feature: route support tickets to a team
Input: ticket subject + body
Decision type: Classification
Selected model: Jev (DecisionService provider)
Expected output: {"decision":"billing|technical|sales","confidence":0..1}
Confidence: yes
Threshold: >=0.90 auto, 0.70-0.90 extra validation, <0.70 human review
Fallback: LLM analysis then human queue
Human escalation: confidence < 0.70 or refund-related
Final action: Application Code assigns the queue after schema + permission checks
