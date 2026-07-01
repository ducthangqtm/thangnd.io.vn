from flask import Blueprint

wc2026_bp = Blueprint(
    'wc2026', 
    __name__, 
    template_folder='templates',
    static_folder='static',
    static_url_path='/static/wc2026'
)

from . import routes
