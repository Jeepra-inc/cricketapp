# Generated by Django 3.2.8 on 2023-12-20 07:41

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('cricket', '0006_match_first_inning_team'),
    ]

    operations = [
        migrations.RenameField(
            model_name='match',
            old_name='first_inning_team',
            new_name='last_inning_team',
        ),
    ]
