from django import forms
from .models import LiveScore, Match, Team, Player

class LiveScoreForm(forms.ModelForm):

    class Meta:
        model = LiveScore
        fields = ['runs', 'extras', 'wicket', 'wicket_by', 'out_player']
        widgets = {
            'runs': forms.RadioSelect,
            'extras': forms.RadioSelect(attrs={'class': 'd-flex gap-2 radio-el flex-wrap'}),
            'out_player': forms.Select(attrs={'class': 'form-select select'}),
            'wicket': forms.RadioSelect(attrs={'class': 'd-flex radio-el flex-wrap gap-2'}),
            'wicket_by': forms.Select(attrs={'class': 'form-select select'}),
        }
    
    

class LiveScoreAdminForm(forms.ModelForm):
    class Meta:
        model = LiveScore
        fields = '__all__'

    match = forms.ModelChoiceField(queryset=Match.objects.all(), empty_label=None, label='Select Match')
    team = forms.ModelChoiceField(queryset=Team.objects.all(), empty_label=None, label='Select Team')
    # bowler = forms.ModelChoiceField(queryset=Player.objects.none(), required=False, label='Select Bowler')

class updateInningForm(forms.ModelForm):
    class Meta:
        model = Match
        fields = []

    def __init__(self, *args, **kwargs):
        super(updateInningForm, self).__init__(*args, **kwargs)
        # Add any customization here, if needed

    # You can add additional validation or custom logic if needed

class PlayerAdminForm(forms.ModelForm):
    class Meta:
        model = Player
        fields = '__all__'  # Include all fields from the Player model


class MatchForm(forms.ModelForm):
    class Meta:
        model = Match
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super(MatchForm, self).__init__(*args, **kwargs)

        # If the instance is not set, return without modifying the queryset
        if not self.instance:
            return

        # Retrieve the teams and batting_team instances from the form's instance
        team1 = self.instance.team1
        team2 = self.instance.team2
        batting_team = self.instance.batting_team

        if team1 and team2 and batting_team:
            # Identify the opponent team based on the batting team
            opponent_team = team2 if batting_team == team1 else team1

            # Get the players from the opponent team
            opponent_players = opponent_team.players.all()

            # Update the choices for the bowler field based on the opponent team's players
            self.fields['bowler'].queryset = opponent_players


        if batting_team:
            # Get the players from the batting team
            batting_team_players = batting_team.players.all()

            # Update the choices for the striker and nonstriker fields
            self.fields['striker'].queryset = batting_team_players
            self.fields['non_striker'].queryset = batting_team_players
