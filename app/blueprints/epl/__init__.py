from flask import Blueprint

epl_bp = Blueprint(
    'epl',
    __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/blueprints/epl/static'
)

from . import routes
