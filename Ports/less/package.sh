#!/usr/bin/env -S bash ../.port_include.sh
port=less
version=530
useconfigure="true"
files="https://ftp.gnu.org/gnu/less/less-${version}.tar.gz less-${version}.tar.gz
https://ftp.gnu.org/gnu/less/less-${version}.tar.gz.sig less-${version}.tar.gz.sig
https://ftp.gnu.org/gnu/gnu-keyring.gpg gnu-keyring.gpg"

depends="ncurses"
auth_type="sig"
auth_opts="--keyring ./gnu-keyring.gpg less-${version}.tar.gz.sig"
