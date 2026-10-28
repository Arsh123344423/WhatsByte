from django.contrib import admin
from .models import Doctor


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'specialization', 'email', 'contact_number', 'years_of_experience', 'created_at')
    list_filter = ('specialization', 'years_of_experience')
    search_fields = ('name', 'specialization', 'email', 'contact_number')
    readonly_fields = ('created_at', 'updated_at')
