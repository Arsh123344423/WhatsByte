from django.conf import settings
from django.db import models
from patients.models import Patient
from doctors.models import Doctor


class PatientDoctorMapping(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='doctor_mappings'
    )
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='patient_mappings'
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_mappings'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = 'Patient Doctor Mapping'
        verbose_name_plural = 'Patient Doctor Mappings'
        unique_together = ('patient', 'doctor')
        ordering = ['-assigned_at']

    def __str__(self):
        return f"{self.patient.name} -> Dr. {self.doctor.name}"
