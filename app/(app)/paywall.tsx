import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, EmptyState, ErrorState, Screen, Skeleton, Text } from '@/components/ui';
import { purchasePackage, restorePurchases } from '@/features/purchases/purchase';
import { useOfferings } from '@/features/purchases/use-offerings';

export default function PaywallScreen() {
  const router = useRouter();
  const { data: offering, isLoading, error, refetch } = useOfferings();
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const handlePurchase = async (identifier: string) => {
    const pkg = offering?.availablePackages.find((p) => p.identifier === identifier);
    if (!pkg) {
      return;
    }
    setPurchaseError(null);
    setPurchasingId(identifier);
    const result = await purchasePackage(pkg);
    setPurchasingId(null);
    if (result.cancelled) {
      return; // user closed the Google Play sheet — not an error
    }
    if (result.error) {
      setPurchaseError(result.error);
      return;
    }
    router.back();
  };

  const handleRestore = async () => {
    setPurchaseError(null);
    const result = await restorePurchases();
    if (result.error) {
      setPurchaseError(result.error);
    }
  };

  if (isLoading) {
    return (
      <Screen className="gap-3 pt-4">
        <Skeleton className="h-8 w-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={refetch} />
      </Screen>
    );
  }

  if (!offering || offering.availablePackages.length === 0) {
    return (
      <Screen>
        <EmptyState
          title="Nothing to buy yet"
          message="Subscription options aren't available right now. This is expected until RevenueCat products are configured."
          action={{ label: 'Go back', onPress: () => router.back() }}
        />
      </Screen>
    );
  }

  return (
    <Screen className="gap-4 pt-4">
      <View className="gap-1">
        <Text variant="display">Go Premium</Text>
        <Text className="text-foreground-secondary">Unlock everything, cancel anytime.</Text>
      </View>
      {offering.availablePackages.map((pkg) => (
        <Card key={pkg.identifier} className="gap-2">
          <Text variant="title">{pkg.product.title}</Text>
          <Text className="text-foreground-secondary">{pkg.product.description}</Text>
          <Button
            label={`Subscribe — ${pkg.product.priceString}`}
            onPress={() => handlePurchase(pkg.identifier)}
            loading={purchasingId === pkg.identifier}
            disabled={purchasingId !== null}
          />
        </Card>
      ))}
      {purchaseError ? (
        <Text variant="caption" className="text-danger">
          {purchaseError}
        </Text>
      ) : null}
      <Button variant="ghost" label="Restore purchases" onPress={handleRestore} />
      <Button variant="ghost" label="Not now" onPress={() => router.back()} />
    </Screen>
  );
}
