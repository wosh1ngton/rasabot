from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
from rasa_sdk.forms import FormValidationAction
import requests
import logging
from typing import Text, Dict, Any, List

logger = logging.getLogger(__name__)



class ActionScheduleAppointment(Action):
    def name(self):
        return "action_marcar_consulta"

    def run(self, dispatcher, tracker, domain):
        try:
            # Extract slot values from the form
            date = tracker.get_slot("data")
            start_time = tracker.get_slot("horario_inicio")
            end_time = tracker.get_slot("horario_fim")
            modality = tracker.get_slot("modalidade")
            patient_name = tracker.get_slot("nome")

            # Validate all slots are filled
            if not all([date, start_time, end_time, modality, patient_name]):
                dispatcher.utter_message(text="Estou com informações faltando para agendar a consulta.")
                return []

            # Call your Node API
            response = requests.post(
                "http://host.docker.internal:3000/whatsapp/schedule-event",
                json={
                    "nomePaciente": patient_name,
                    "data": date,
                    "horarioInicio": start_time,
                    "horarioFim": end_time,
                    "modalidade": modality
                },
                timeout=10
            )

            if response.status_code == 200:
                link = response.json().get("eventLink")
                dispatcher.utter_message(text=f"Consulta agendada com sucesso! Aqui está o link: {link}")
            else:
                logger.error(f"API returned status {response.status_code}: {response.text}")
                dispatcher.utter_message(text="Desculpe, não consegui agendar a consulta. Por favor, tente novamente.")

        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            dispatcher.utter_message(text="Desculpe, estou com problemas para conectar com o serviço de agendamento.")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            dispatcher.utter_message(text="Desculpe, algo deu errado. Por favor, tente novamente.")

        return []