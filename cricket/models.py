from django.db import models
from django.utils import timezone
from datetime import time
from datetime import datetime
import os


class Coach(models.Model):
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    country = models.CharField(max_length=50)
    coaching_experience = models.PositiveIntegerField()
    specialized_in = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Team(models.Model):
    name = models.CharField(max_length=100)
    country = models.CharField(max_length=50)
    coach = models.ForeignKey(Coach, on_delete=models.CASCADE)
    players = models.ManyToManyField('Player', related_name='teams')
    logo = models.ImageField(upload_to='team_logos/', null=True, blank=True)
    team_profile = models.TextField(blank=True)

    def __str__(self):
        return self.name
    
def player_image_path(instance, filename):
    # Get the team name
    team_name = instance.team.name

    # Construct the path, joining the team name and the original filename
    path = os.path.join('players', team_name, filename)

    return path

class Player(models.Model):
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    date_of_birth = models.DateField()
    country = models.CharField(max_length=50)
    batting_hand = models.CharField(max_length=20)
    bowling_style = models.CharField(max_length=50)
    player_image = models.ImageField(upload_to=player_image_path, null=True, blank=True)
    team = models.ForeignKey('Team', on_delete=models.CASCADE, related_name='players_of_team')
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"



class Umpire(models.Model):
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    country = models.CharField(max_length=50)
    experience_years = models.PositiveIntegerField()
    match = models.ForeignKey('Match', on_delete=models.CASCADE, related_name='match', null=True, blank=True)


    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Location(models.Model):
    name = models.CharField(max_length=100)
    city = models.CharField(max_length=50)
    country = models.CharField(max_length=50)
    address = models.CharField(max_length=200)
    # Add other fields as needed

    def __str__(self):
        return self.name

class Match(models.Model):
    TOSS_DECISION_CHOICES = [
        ('bat', 'Decided to bat first'),
        ('bowl', 'Decided to bowl first'),
    ]

    INNING_CHOICES = [
        (1, 'First Inning'),
        (2, 'Second Inning'),
    ]

    MATCH_TYPE = [
        (1, 'Day'),
        (2, 'Day and Night'),
    ]

    match_name = models.CharField(max_length=100)
    date = models.DateField()
    time = models.TimeField(null=True, blank=True)  # New field for time
    location = models.ForeignKey(Location, on_delete=models.CASCADE)
    umpire = models.ManyToManyField('Umpire', related_name='umpires')
    team1 = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='team1_matches', default=None)
    team2 = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='team2_matches', default=None)
    batting_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='batting_team_matches', null=True, blank=True)
    toss_winner = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='toss_winner', null=True, blank=True)
    toss_decision = models.CharField(max_length=4, choices=TOSS_DECISION_CHOICES, null=True, blank=True)
    bowler = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='bowler_matches', null=True, blank=True)
    striker = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='striker_matches', null=True, blank=True)
    non_striker = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='non_striker_matches', null=True, blank=True)
    inning = models.IntegerField(choices=INNING_CHOICES, null=True, blank=True, default=1)
    match_type = models.IntegerField(choices=MATCH_TYPE, null=True, blank=True, default=1)
    last_inning_team = models.CharField(max_length=4, null=True, blank=True)


    # Add other fields as needed

    def __str__(self):
        return self.match_name
    

class League(models.Model):
    T20 = 'T20'
    ODI = 'ODI'

    MATCH_FORMAT_CHOICES = [
        (T20, 'T20'),
        (ODI, 'ODI'),
    ]
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    country = models.CharField(max_length=50)
    match_format = models.CharField(
        max_length=3,
        choices=MATCH_FORMAT_CHOICES,
        default=T20,  # You can set the default option if needed
    )
    matches = models.ManyToManyField(Match, related_name='leagues', blank=True)
    # Add other fields as needed

    def __str__(self):
        return self.name
    

class LiveScore(models.Model):
    timestamp = models.DateTimeField(default=timezone.now)
    match = models.ForeignKey(Match, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True)
    bowler = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True)
    runs = models.PositiveIntegerField(choices=[(0, '0'), (1, '1'), (2, '2'), (3, '3'), (4, '4'), (5, '5'), (6, '6')], default=0)
    extras = models.CharField(max_length=20, choices=[('no_extra', 'NE'),('wide', 'WD'),('wide_run', 'WD + R'),('byes', 'B'), ('leg_byes', 'LB'),('no_ball', 'NB'), ('no_ball_runs', 'NB + R'),('no_ball_byes', 'NB + B'),('no_ball_lb', 'NB + LB'),('penalty_runs', 'PR')], default='no_extra')
    wicket = models.CharField(max_length=30, choices=
                                [
                                  ('not_out', 'NO'), 
                                  ('bowled_out', 'B'), 
                                  ('caught_out', 'C'),
                                  ('leg_before_wicket', 'LBW'), 
                                  ('run_out', 'RO'), 
                                  ('stumped_out', 'ST'), 
                                  ('hit_wicket', 'HT WKT'),
                                  ('retired_out', 'RET'), 
                                  ('timed_out', 'TO'),
                                  ('hit_the_ball_twice', 'HBT'),
                                  ('obstructing_the_field', 'OF'), 
                                  ('retired_not_out', 'RET NO'), 
                                ], default='not_out')
    # Add fields for "Strike" and "Non Strike" players
    strike = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name='strike_scores', verbose_name='Strike Player')
    non_strike = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name='non_strike_scores', verbose_name='Non-Strike Player')
    out_player = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name='out_scores', verbose_name='Out Player')
    wicket_by = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name='wicket_by_scores', verbose_name='Wicket By Player')
    wicket_at = models.CharField(max_length=4, null=True, blank=True, verbose_name='Wicket At')
    run_at = models.CharField(max_length=4, null=True, blank=True, verbose_name='Run At')
    partner = models.CharField(max_length=4, null=True, blank=True, verbose_name='Partner')
    partner_data = models.CharField(max_length=4, null=True, blank=True, verbose_name='Partner Data')



    def __str__(self):
        return f"LiveScore: {self.match} - {self.team} - {self.bowler}"

    