# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.hostname = "cellarium-box"

  config.vm.provision "shell", inline: <<-SCRIPT
    sudo apt-get install python-pip -y
    sudo apt-get install git -y
    sudo pip install PyYAML
    git clone https://github.com/kvalle/dotfiles.git

    ## sudo pip install Flask
    #git clone https://github.com/twilio/flask-restful.git
	  #cd flask-restful
	  #sudo python setup.py develop
SCRIPT

  config.vm.network "forwarded_port", guest: 1337, host: 1337
  config.vm.synced_folder "", "/home/vagrant/cellarium"
end
