from django.contrib import admin
from django import forms
from .models import Player, Coach, Team, League, Umpire, LiveScore, Match, Location
from .forms import LiveScoreAdminForm, PlayerAdminForm, MatchForm



class LiveScoreAdmin(admin.ModelAdmin):
    form = LiveScoreAdminForm
    change_form_template = "cricket/LiveScore_change_form.html"


class MatchAdmin(admin.ModelAdmin):
    form = MatchForm

    class Media:
        js = ('https://code.jquery.com/jquery-3.6.0.min.js', 'admin/custom_admin.js')



class PlayerAdmin(admin.ModelAdmin):
    form = PlayerAdminForm

admin.site.register(Player, PlayerAdmin)
admin.site.register(Coach)
admin.site.register(Team)
admin.site.register(League)
admin.site.register(Umpire)
admin.site.register(LiveScore, LiveScoreAdmin)
admin.site.register(Match, MatchAdmin)
admin.site.register(Location)

