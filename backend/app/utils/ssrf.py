import socket
import ipaddress
from urllib.parse import urlparse
from app.core.config import settings

def is_ip_private(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
        return (
            ip.is_private or
            ip.is_loopback or
            ip.is_reserved or
            ip.is_link_local or
            ip.is_multicast or
            ip_str.startswith("169.254.") # AWS / GCP cloud metadata
        )
    except ValueError:
        return True

def validate_url_for_ssrf(url: str, allow_private: bool = None) -> tuple[bool, str]:
    """
    Validates URL to protect against Server-Side Request Forgery (SSRF).
    Returns (is_valid: bool, error_message: str).
    """
    if allow_private is None:
        allow_private = settings.ALLOW_PRIVATE_NETWORKS

    try:
        parsed = urlparse(url)
    except Exception:
        return False, "Invalid URL format"

    if parsed.scheme.lower() not in ("http", "https"):
        return False, f"Unsupported protocol '{parsed.scheme}'. Only HTTP and HTTPS are permitted."

    hostname = parsed.hostname
    if not hostname:
        return False, "URL must contain a valid hostname or IP address"

    # Explicitly check common dangerous aliases
    lowered_host = hostname.lower()
    if lowered_host in ("localhost", "127.0.0.1", "0.0.0.0", "::1", "metadata.google.internal") and not allow_private:
        return False, f"Target '{hostname}' refers to localhost or cloud metadata which is blocked for security."

    # Resolve hostname to IP to prevent DNS rebinding / private IP access
    try:
        addr_info = socket.getaddrinfo(hostname, None)
        ips = [info[4][0] for info in addr_info]
    except socket.gaierror:
        # If simulation or testing internal names, allow DNS fail only if simulated
        return False, f"Could not resolve domain '{hostname}'"
    except Exception as e:
        return False, f"DNS resolution failed: {str(e)}"

    if not allow_private:
        for ip in ips:
            if is_ip_private(ip):
                return False, f"Destination IP '{ip}' is in a private/restricted address range and blocked by SSRF policy."

    return True, ""
