## SerenityOS network booting

By network booting, this guide implies a target computer (physical or virtual) that tries to boot over the network through PXE. The setup presented here is also diskless, as the bootloader and the root file system are supplied over the network. This can be achieved using GRUB2 or PXELINUX although only GRUB2 provides a framebuffer to display the Serenity desktop.

Note: it is recommended to boot a mainstream operating system through PXE on the target at least once before attempting this, if only to make sure that your setup works.

### General notes

This guide assumes several things:

- The TFTP server root is `/srv/tftp/`
- Bootloaders are located inside `/srv/tftp/boot/`
- SerenityOS artefacts are located inside `/srv/tftp/serenity/`:
    - The kernel is located at `/srv/tftp/serenity/kernel`
        - You can find it at `Build/i686/Kernel/Kernel`
    - The ramdisk is located at `/srv/tftp/serenity/ramdisk`
        - You can use the QEMU image at `Build/i686/_disk_image` as a ramdisk
        
`grub-pc-bin`, which contains the BIOS modules for PXE booting GRUB2, isn't available from the ARM repos of Debian and Ubuntu so if you are using an ARM machine for your TFTP server you will need to extract and copy across the contents of the `/usr/lib/grub/i386-pc/` directory from the x86 package or build the files manually.

### GRUB2

The easiest way to set up a DHCP and TFTP server is by using `dnsmasq`.

1. Install the required packages on the TFTP server:
    - Debian and Ubuntu: `sudo apt install grub-pc-bin dnsmasq`
    - Make sure `/srv/tftp/` is owned by the user `tftp`, otherwise the TFTP server won't serve files.
        
2. Configure `/etc/dnsmasq.conf` like so, adjusting it appropriately for your hardware and network:

```
# Interface to use to provide DHCP and TFTP
interface=eth0

bind-interfaces

# Set default gateway
dhcp-option=3,192.168.0.1

# Set DNS servers to announce
dhcp-option=6,1.1.1.1

# If using IPV4, dnsmasq can coexist alongside another DHCP server
# by using the proxy command with dhcp-range instead.
dhcp-range=192.168.0.10,192.168.0.222,12h

# Don't function as a DNS server.
port=0

# Log information about DHCP transactions.
log-dhcp

# Set the root directory for files available via FTP,
tftp-root=/srv/tftp

enable-tftp

# The boot filename, Server name, Server Ip Address
dhcp-boot=boot/grub2/i386-pc/core.0,,192.168.0.7
```

After configuring dnsmasq, start it by running `sudo systemctl start dnsmasq`

3. Copy all of the GRUB module files from `/usr/lib/grub/i386-pc/` into both `/srv/tftp/boot/grub/i386-pc` and `/srv/tftp/boot/grub2/i386-pc`

4. Create a GRUB2 configuration file at `/srv/tftp/boot/grub/grub.cfg` like this:

```
set gfxmode=auto
insmod all_video
insmod gfxterm
terminal_output gfxterm

menuentry 'SerenityOS - netboot diskless graphical mode' {
        echo 'Loading kernel...'
        multiboot (tftp)/serenity/kernel root=/dev/ramdisk0
        echo 'Loading ramdisk...'
        module (tftp)/serenity/ramdisk
        echo 'Starting SerenityOS.'
}

menuentry 'SerenityOS - netboot diskless text mode' {
        set gfxkeep=text
        terminal_output console
        echo 'Loading kernel...'
        multiboot (tftp)/serenity/kernel root=/dev/ramdisk0 boot_mode=text
        echo 'Loading ramdisk...'
        module (tftp)/serenity/ramdisk
        echo 'Starting SerenityOS.'
}
```
5. Place the SerenityOS kernel and ramdisk inside `/srv/tftp/boot/grub/serenity/`

You should now be able to PXE boot into Serenity if enough of your hardware is supported by the Serenity kernel.



### PXELINUX

Warning: PXELINUX cannot set up a framebuffer for Multiboot targets, so you will most likely have no graphics on real hardware.

1. Install required packages on the TFTP server
    - Debian: `apt install pxelinux tftpd-hpa`
    - Make sure `/srv/tftp/` is owned by the user `tftp`, otherwise the TFTP server won't serve files
2. Configure the DHCP server with the following options:
    - Next server IP: `<static IP address of TFTP server>`
    - Boot filename (for BIOS): `boot/pxelinux/lpxelinux.0`
3. Place all the required bootloader modules (located inside `/usr/lib/PXELINUX/` and `/usr/lib/syslinux/modules/bios/` on Debian) inside `/srv/tftp/boot/pxelinux/`, which for the sample configuration file includes:
    - lpxelinux.0
    - ldlinux.c32
    - vesamenu.c32
    - libcom32.c32
    - libutil.c32
    - mboot.c32
4. Put your `default` configuration file inside `/srv/tftp/boot/pxelinux/pxelinux.cfg/`
5. Place the SerenityOS kernel and ramdisk inside `/srv/tftp/boot/grub/serenity/`

Sample PXELINUX `default` configuration file:

```
UI vesamenu.c32

LABEL SerenityOS
        KERNEL mboot.c32
        APPEND ../../serenity/kernel root=/dev/ramdisk0 --- ../../serenity/ramdisk
```

### Troubleshooting

- Issues with DHCP or TFTP usually require sniffing packets on the network to figure out.
- TFTP is a slow protocol, transferring the QEMU disk image (~ 200 MiB) will take some time. Consider setting up a FTP or HTTP server for faster downloading of SerenityOS artefacts if your bootloader supports it.
- Remember that SerenityOS has not been extensively tested on physical hardware.
- Some BIOS implementations of PXE are buggy or some machines may not have a PXE boot option at all in which case you could try using [iPXE](https://ipxe.org/).
- Virtual machines can also be booted over the network. Cheat notes for QEMU on Linux, assuming `br0` is already set up:

```
ip tuntap add tap0 mode tap user <username>
ip link set tap0 master br0
ip link set tap0 up

echo 0 > /proc/sys/net/bridge/bridge-nf-call-iptables
echo 0 > /sys/devices/virtual/net/br0/bridge/multicast_querier

qemu-system-i386 -m 4096 -netdev tap,ifname=tap0,script=no,downscript=no,id=network0 -device e1000,netdev=network0 -boot n -debugcon stdio -s
```
