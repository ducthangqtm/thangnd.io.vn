from flask import Blueprint

c1_bp = Blueprint(
    'c1',
    __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/blueprints/c1/static'
)

from . import routes
