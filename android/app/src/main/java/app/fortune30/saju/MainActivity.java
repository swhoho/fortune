package app.fortune30.saju;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    /**
     * 이 메서드는 SocialLogin 플러그인이 MainActivity가 올바르게 수정되었음을
     * 확인하기 위한 마커 메서드입니다. 구현 내용은 비어 있어도 됩니다.
     */
    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {
        // 마커 메서드 - 구현 필요 없음
    }
}
