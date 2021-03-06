"""
Copyright (c) 2012-2013 RockStor, Inc. <http://rockstor.com>
This file is part of RockStor.

RockStor is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published
by the Free Software Foundation; either version 2 of the License,
or (at your option) any later version.

RockStor is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
"""

from django.db import transaction
from django.utils.timezone import utc
from rest_framework.response import Response
from smart_manager.models import (ReplicaShare, ReceiveTrail)
from smart_manager.serializers import (ReceiveTrailSerializer)
from datetime import (datetime, timedelta)
import rest_framework_custom as rfc


class ReceiveTrailView(rfc.GenericView):
    serializer_class = ReceiveTrailSerializer

    def get_queryset(self, *args, **kwargs):
        if ('rtid' in kwargs):
            self.pagninate_by = 0
            try:
                return ReceiveTrail.objects.get(id=kwargs['rtid'])
            except:
                return []

        if ('rid' in kwargs):
            replica = ReplicaShare.objects.get(id=kwargs['rid'])
            return ReceiveTrail.objects.filter(rshare=replica).order_by('-id')
        return ReceiveTrail.objects.filter().order_by('-id')

    @transaction.commit_on_success
    def post(self, request, rid):
        with self._handle_exception(request):
            rs = ReplicaShare.objects.get(id=rid)
            ts = datetime.utcnow().replace(tzinfo=utc)
            snap_name = request.DATA.get('snap_name')
            rt = ReceiveTrail(rshare=rs, snap_name=snap_name,
                              status='pending', receive_pending=ts)
            rt.save()
            return Response(ReceiveTrailSerializer(rt).data)

    @transaction.commit_on_success
    def put(self, request, rtid):
        with self._handle_exception(request):
            rt = ReceiveTrail.objects.get(id=rtid)
            rt.receive_succeeded = request.DATA.get('receive_succeeded',
                                                    rt.receive_succeeded)
            rt.receive_failed = request.DATA.get('receive_failed',
                                                 rt.receive_failed)
            rt.status = request.DATA.get('status', rt.status)
            rt.error = request.DATA.get('error', rt.error)
            rt.kb_received = request.DATA.get('kb_received', rt.kb_received)
            rt.end_ts = request.DATA.get('end_ts', rt.end_ts)
            rt.save()
            return Response(ReceiveTrailSerializer(rt).data)

    @transaction.commit_on_success
    def delete(self, request, rid):
        with self._handle_exception(request):
            days = int(request.DATA.get('days', 30))
            rs = ReplicaShare.objects.get(id=rid)
            ts = datetime.utcnow().replace(tzinfo=utc)
            ts0 = ts - timedelta(days=days)
            if (ReceiveTrail.objects.filter(rshare=rs).count() > 100):
                ReceiveTrail.objects.filter(
                    rshare=rs, end_ts__lt=ts0).delete()
            return Response()
