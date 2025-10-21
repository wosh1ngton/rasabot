from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
from rasa_sdk.forms import FormValidationAction
import requests
import logging
from typing import Text, Dict, Any, List
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)



class ActionScheduleAppointment(Action):
    def name(self):
        return "action_agendar_consulta"

    def run(self, dispatcher, tracker, domain):
        try:
            # Extract slot values from the form
            date = tracker.get_slot("data")
            start_time = tracker.get_slot("hora")
            
            modality = tracker.get_slot("modalidade")
            patient_name = tracker.get_slot("nome")

            end_time = self._calculate_end_time(start_time)

            data_formatada = self._convert_to_api_date(date)
            hora_inicio_formatada = self._convert_to_api_time(start_time)
            hora_fim_formatada = self._convert_to_api_time(end_time)

            # Validate all slots are filled
            if not all([date, start_time, end_time, modality, patient_name]):
                dispatcher.utter_message(text="Estou com informações faltando para agendar a consulta.")
                return []

            # Call your Node API
            response = requests.post(
                "http://host.docker.internal:3000/whatsapp/schedule-event",
                json={
                    "nomePaciente": patient_name,
                    "data": data_formatada,
                    "horarioInicio": hora_inicio_formatada,
                    "horarioFim": hora_fim_formatada,
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
    
    def _convert_to_api_date(self, data: str) -> str:
        """Convert natural language date to YYYY-MM-DD format."""
        from datetime import datetime, timedelta
        
        try:
            data_lower = data.lower()
            
            # Handle relative dates
            if data_lower == 'amanhã' or data_lower == 'amanha':
                tomorrow = datetime.now() + timedelta(days=1)
                return tomorrow.strftime("%Y-%m-%d")
            elif data_lower == 'hoje':
                return datetime.now().strftime("%Y-%m-%d")
            elif 'segunda' in data_lower:
                # Simple implementation - you might want to improve this
                days_ahead = (0 - datetime.now().weekday()) % 7
                if days_ahead == 0: days_ahead = 7  # Next Monday
                next_monday = datetime.now() + timedelta(days=days_ahead)
                return next_monday.strftime("%Y-%m-%d")
            elif 'terça' in data_lower or 'terca' in data_lower:
                days_ahead = (1 - datetime.now().weekday()) % 7
                if days_ahead == 0: days_ahead = 7
                next_day = datetime.now() + timedelta(days=days_ahead)
                return next_day.strftime("%Y-%m-%d")
            # Add more day mappings as needed...
            
            # Default: assume current year and try to parse
            current_year = datetime.now().year
            if '/' in data:
                # Format: 21/10
                day, month = map(int, data.split('/'))
                return f"{current_year}-{month:02d}-{day:02d}"
            elif data.isdigit() and len(data) <= 2:
                # Format: 21 (just day)
                day = int(data)
                month = datetime.now().month
                return f"{current_year}-{month:02d}-{day:02d}"
            else:
                # Fallback to today
                return datetime.now().strftime("%Y-%m-%d")
                
        except Exception:
            # Fallback to today
            return datetime.now().strftime("%Y-%m-%d")
    
    
        
    def _calculate_end_time(self, start_time: str) -> str:
        """Calculate end time (start time + 50 minutes)."""
        try:
            # First, convert the start time to proper format to parse it
            formatted_start = self._convert_to_api_time(start_time)
            
            # Now parse the formatted time
            if ':' in formatted_start:
                hours, minutes = map(int, formatted_start.split(':'))
            else:
                # If no colon, try to extract hours
                hours = int(formatted_start[:2]) if len(formatted_start) >= 2 else 14
                minutes = 0
            
            # Add 50 minutes
            total_minutes = hours * 60 + minutes + 50
            end_hours = total_minutes // 60
            end_minutes = total_minutes % 60
            
            # Format as HH:MM with leading zeros
            return f"{end_hours:02d}:{end_minutes:02d}"
            
        except Exception as e:
            print(f"Error calculating end time: {e}")
            return "16:40"  # Fallback

    def _convert_to_api_time(self, time_str: str) -> str:
        """Convert natural language time to HH:MM format."""
        try:
            time_lower = time_str.lower().strip()
            
            # Handle different time formats
            if ':' in time_str:
                # Format: 14:00 or 1900:00 (incorrect)
                parts = time_str.split(':')
                if len(parts[0]) == 4:  # Handle 1900:00 case
                    # Convert 1900 to 19:00
                    hours = parts[0][:2]
                    minutes = parts[0][2:]
                    return f"{int(hours):02d}:{int(minutes):02d}"
                else:
                    # Normal case: 14:00
                    hours, minutes = parts[0], parts[1]
                    return f"{int(hours):02d}:{int(minutes):02d}"
                    
            elif 'h' in time_str:
                # Format: 14h or 19h
                hours = time_str.replace('h', '').strip()
                return f"{int(hours):02d}:00"
                
            elif 'horas' in time_lower:
                # Format: 14 horas
                hours = time_lower.replace('horas', '').strip()
                return f"{int(hours):02d}:00"
                
            elif 'da tarde' in time_lower:
                # Format: 2 da tarde
                hours = int(''.join(filter(str.isdigit, time_lower)))
                if hours < 12:  # Convert to 24h format
                    hours += 12
                return f"{hours:02d}:00"
                
            elif 'da manhã' in time_lower or 'da manha' in time_lower:
                # Format: 10 da manhã
                hours = int(''.join(filter(str.isdigit, time_lower)))
                return f"{hours:02d}:00"
                
            else:
                # Try to extract numbers
                import re
                numbers = re.findall(r'\d+', time_str)
                if numbers:
                    hours = int(numbers[0])
                    return f"{hours:02d}:00"
                else:
                    return "14:00"  # Fallback
                    
        except Exception as e:
            print(f"Error converting time '{time_str}': {e}")
            return "14:00"  # Fallback