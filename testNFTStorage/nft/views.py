from django.shortcuts import render
from .models import NFT
from django.http import JsonResponse


def get_metadata(request, id):
    nft = NFT.objects.filter(id=1).first()
    data = {
        'name': nft.name,
        'description': nft.description,
        'image': f"http://{request.get_host()}/media/{nft.image}"
    }
    return JsonResponse(data, safe=False)
