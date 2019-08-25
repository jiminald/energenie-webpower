# Energenie Web Power Controller

I've written this for a beginner looking to get into basic home automation as well as learning how to code. Every decision point is commented in the code to explain why we are doing things and what impact it has.

### Friendly warning
This software does not have any way of authenticating or validating the user, which means that anyone who is logged onto your home network can access this and start controlling the devices connected.

## Hardware Requirements

This program is for a Raspberry Pi using a pi-mote add-on from Energenie.

- Raspberry Pi 3/4 (I've not tested this on others)
- [Pi-mode control starter kit with 2 sockets](https://energenie4u.co.uk/catalogue/product/ENER002-2PI)


## Pre-Requisites
You need to make sure your system is up-to-date and has the required Python modules installed.

First, update your system.
```
sudo apt update
sudo apt dist-upgrade
```

Then install the git and the python modules required
```
sudo apt install git python3-gpiozero python3-bottle
```


## Installation

The latest version can be installed by cloning the repo:

```bash
cd /home/pi
git clone https://github.com/jiminald/energenie-webpower.git
```

## Starting the application

Go to the project folder, and run the following command

```bash
cd /home/pi/energenie-webpower
./server.py
```

Your server has now started. Now you can go to http://192.168.1.1:8080/ (Replace 192.168.1.1 with the IP of your Pi)

To exit, press `CTRL + C`

## Configuration

All of the configuration is stored in `config.json`. Edit this file to configure your sockets to how you want them to work.

```json
{
	"http_host": "0.0.0.0",
	"http_port": "8080",
	"sockets" : {
		"1": {
			"name" : "Socket 1",
			"default_state": true
		},
		"2": {
			"name" : "Socket 2",
			"default_state": false
		}
	}
}
```

### http_host
Set the IP the web server is to listen on (Default: `0.0.0.0`) \
By Default, its set to `0.0.0.0` which means that it will listen on all IP addresses the Pi has on both the wired and wireless network interfaces.

### http_port
Set the web port you want the power control to listen on (Default: `8080`) \
Using port `8080` allows any user on the pi to start the web server. You can change this to `80` (default web port) but it does need the root user to do this. The service file runs the web server as root, so changing the port number to `80` is easy!

### sockets
This holds the configuration for all of your engergenie sockets. Each of the sockets are number between 1-4, and the configuation is setup to match this.

#### socket_config
- ##### name
A friendly name of the socket, for example if the socket controls your lamp, give it the name "Lamp"

- ##### default_state
This is the default state the socket should be in when the web server starts. If, for example, your lamp should always be on when the pi starts, set it to `true`

## Setting the program to automatically start on boot

The program can be set to startup automatically by copying the startup file to the systemd service folder and then running the following commands.

```bash
sudo cp /home/pi/energenie-webpower/energenie-webpower.service /etc/systemd/system/
sudo systemctl enable energenie-webpower.service
sudo service energenie-webpower start
```

This registered energenie-webpower as a service, so it can start up when the system does, and then starts the service instantly.

## Turning the sockets on and off automatically

You can easily setup the pi to turn on and off your sockets using the built in event scheduler called `cron`.

Lets look at the structure of the cron command.\
The first section of digits we come across is the minutes. We can setup scripts to be ran every 5 minutes, having it first makes this easier to read and to configure.\
The second section of digits we see is the hour, this is where we can say "Run at 8am" or "Run between 10am and 2pm".\
The third section is the day of the month, you may run something at the first of the month, you can set that up here.\
The fouth section is the month or months we want to schedule a script to run. There maybe something you do during winter that you dont during summer, this makes it easier to program in now and forget it for later.\
The fifth section is the day of the week to run (Mon-Sun). You may only say "Run this on a Sunday".\
Any finally, anything after this is the command we run on the scheduled time.

You can set any number of options in cron, such as, only run every Monday at 3:33am if its between the months of April to August (Which would be `33 3 * 4-8 1` [See this on crontab.guru](https://crontab.guru/#33_3_*_4-8_1) )\
To work out any combination you need for a cron date, try [crontab.guru](https://crontab.guru/)

By using a built-in piece of software called `wget`, we can pretend to be a real-life user who is toggling the power on and off.\
`wget` will automatically save the data returned to us when we request a url. In this case, we dont need to save anything, so we'll use `wget`'s option -O (capital o) to put the data returned into `/dev/null`. `/dev/null` is a special location that is treated like a black hole, anything can go into it, but nothing will come out.

To start using cron, login via SSH and type `crontab -e`. (If you get asked which editor to choose, select `nano`. This is the easiest text editor on linux) \
If you wanted your "Lamp" socket to turn on at 6pm, you would add the following line.

```bash
0 18 * * * wget -O/dev/null http://127.0.0.1:8080/state/1/on
```

And then to turn the "Lamp" off at 1am, you would need to add

```bash
0 1 * * * wget -O/dev/null http://127.0.0.1:8080/state/1/off
```

You may need to change the IP address and/or port number to whatever is written in your `config.json`. `127.0.0.1` is a special IP address that allows you to communicate with services on the local machine, even if it had no external network connection. \
Don't forget that you may need to change the socket number (in my case 1) to whatever socket is attached to your "Lamp", as set in your `config.json`

Once your happy with this, press `CTRL + X` (This tells nano your ready to exit). Nano will then ask you if your happy with the changes you've made;\
Press **Y** for Yes, **N** for No, **CTRL+C** if you want to go back to editing.\
If you selected **Yes**, it will ask you for a filename, just press **ENTER** as we don't need to change it.\
If you selected **No**, any changes you made will be lost.
